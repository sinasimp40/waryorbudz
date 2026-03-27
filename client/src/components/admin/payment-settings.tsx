import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Mail, Zap } from "lucide-react";
import { SiBitcoin, SiEthereum } from "react-icons/si";

interface PaymentSettings {
  apiKeyConfigured: boolean;
  ipnSecretConfigured: boolean;
  etransferEmail: string;
  shakepayHandle: string;
}

export function PaymentSettings() {
  const [apiKey, setApiKey] = useState("");
  const [ipnSecret, setIpnSecret] = useState("");
  const [etransferEmail, setEtransferEmail] = useState("");
  const [shakepayHandle, setShakepayHandle] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showIpnSecret, setShowIpnSecret] = useState(false);
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/settings/payment"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { apiKey?: string; ipnSecret?: string; etransferEmail?: string; shakepayHandle?: string }) => {
      return apiRequest("POST", "/api/settings/payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/payment"] });
      toast({ title: "Settings saved", description: "Your payment settings have been updated successfully" });
      setApiKey("");
      setIpnSecret("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveManual = () => {
    saveMutation.mutate({
      etransferEmail: etransferEmail,
      shakepayHandle: shakepayHandle,
    });
  };

  const handleSaveCrypto = () => {
    const data: { apiKey?: string; ipnSecret?: string } = {};
    if (apiKey.trim()) data.apiKey = apiKey.trim();
    if (ipnSecret.trim()) data.ipnSecret = ipnSecret.trim();
    if (Object.keys(data).length === 0) {
      toast({ title: "No changes", description: "Please enter at least one value to update", variant: "destructive" });
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Manual Payment Methods */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Manual Payment Methods
          </CardTitle>
          <CardDescription>
            Configure E-Transfer and Shakepay details. These will be shown to customers when they choose these payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="etransferEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                E-Transfer Email
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="etransferEmail"
                  type="email"
                  placeholder={settings?.etransferEmail || "your@etransfer-email.com"}
                  value={etransferEmail}
                  onChange={(e) => setEtransferEmail(e.target.value)}
                  data-testid="input-etransfer-email"
                />
                {settings?.etransferEmail && (
                  <span className="flex items-center gap-1 text-xs text-green-500 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    Set
                  </span>
                )}
              </div>
              {settings?.etransferEmail && (
                <p className="text-xs text-muted-foreground">Current: <span className="text-foreground font-medium">{settings.etransferEmail}</span></p>
              )}
              <p className="text-xs text-muted-foreground">Customers will send Interac e-transfers to this address</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shakepayHandle" className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Shakepay Handle
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="shakepayHandle"
                    type="text"
                    placeholder={settings?.shakepayHandle || "yourhandle"}
                    value={shakepayHandle}
                    onChange={(e) => setShakepayHandle(e.target.value.replace(/^@/, ""))}
                    className="pl-7"
                    data-testid="input-shakepay-handle"
                  />
                </div>
                {settings?.shakepayHandle && (
                  <span className="flex items-center gap-1 text-xs text-green-500 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    Set
                  </span>
                )}
              </div>
              {settings?.shakepayHandle && (
                <p className="text-xs text-muted-foreground">Current: <span className="text-foreground font-medium">@{settings.shakepayHandle}</span></p>
              )}
              <p className="text-xs text-muted-foreground">Customers will send Shakepay payments to this handle</p>
            </div>
          </div>

          <Button
            onClick={handleSaveManual}
            disabled={saveMutation.isPending}
            className="gap-2"
            data-testid="button-save-manual-settings"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Manual Payment Info"}
          </Button>
        </CardContent>
      </Card>

      {/* Crypto Payment Gateway */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <SiBitcoin className="w-4 h-4 text-orange-500" />
              <SiEthereum className="w-4 h-4 text-blue-400" />
            </div>
            Crypto Payment Gateway
          </CardTitle>
          <CardDescription>
            Configure your payment gateway API credentials for accepting Bitcoin and Ethereum payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">API Key</Label>
                {settings?.apiKeyConfigured ? (
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertCircle className="w-3 h-3" />
                    Not configured
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder={settings?.apiKeyConfigured ? "Enter new API key to update" : "Enter your payment gateway API key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                  data-testid="input-api-key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Get your API key from your crypto payment provider dashboard</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ipnSecret">IPN Secret</Label>
                {settings?.ipnSecretConfigured ? (
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertCircle className="w-3 h-3" />
                    Not configured
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="ipnSecret"
                  type={showIpnSecret ? "text" : "password"}
                  placeholder={settings?.ipnSecretConfigured ? "Enter new IPN secret to update" : "Enter your IPN secret key"}
                  value={ipnSecret}
                  onChange={(e) => setIpnSecret(e.target.value)}
                  className="pr-10"
                  data-testid="input-ipn-secret"
                />
                <button
                  type="button"
                  onClick={() => setShowIpnSecret(!showIpnSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showIpnSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Used to verify payment notifications (IPN callbacks)</p>
            </div>
          </div>

          <Button
            onClick={handleSaveCrypto}
            disabled={saveMutation.isPending || (!apiKey.trim() && !ipnSecret.trim())}
            className="gap-2"
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Crypto Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
