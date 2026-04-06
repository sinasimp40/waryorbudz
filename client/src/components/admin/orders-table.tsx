import { useState } from "react";
import type { Order, OrderItem, TrackingHistory } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Clock, CheckCircle2, XCircle, Loader2, Copy, Search, Filter, RefreshCw, Trash2, Shield, Package, History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  awaiting_manual: { label: "Awaiting Verification", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <Shield className="w-3 h-3" /> },
  confirming: { label: "Confirming", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  expired: { label: "Expired", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <XCircle className="w-3 h-3" /> },
};

export function OrdersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-muted/50 rounded-md animate-pulse"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<string | null>(null);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: expandedItems } = useQuery<OrderItem[]>({
    queryKey: ["/api/orders", expandedOrderId, "items"],
    queryFn: async () => {
      if (!expandedOrderId) return [];
      const res = await apiRequest("GET", `/api/orders/${expandedOrderId}/items`);
      return res.json();
    },
    enabled: !!expandedOrderId,
  });

  const { data: trackingHistoryData } = useQuery<TrackingHistory[]>({
    queryKey: ["/api/admin/orders", historyOrderId, "tracking-history"],
    queryFn: async () => {
      if (!historyOrderId) return [];
      const res = await apiRequest("GET", `/api/admin/orders/${historyOrderId}/tracking-history`);
      return res.json();
    },
    enabled: !!historyOrderId,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/orders/sync-status", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const updated = data.results?.filter((r: any) => r.previousStatus !== r.newStatus).length || 0;
      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} pending orders. ${updated} orders updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync order statuses",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/orders"] });
      toast({
        title: "Order deleted",
        description: "The order has been permanently deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/verify`, { trackingNumber });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/orders"] });
      setVerifyingOrder(null);
      setTrackingInputs({});
      toast({
        title: "Payment Verified",
        description: "Order has been marked as completed with tracking number. Customer has been notified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/tracking`, { trackingNumber });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/orders"] });
      setTrackingInputs({});
      setEditingTrackingOrder(null);
      toast({
        title: data.isUpdate ? "Tracking Updated" : "Tracking Added",
        description: data.isUpdate
          ? "Tracking number has been updated and the customer has been notified via email."
          : "Tracking number has been saved and the customer has been notified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tracking number",
        variant: "destructive",
      });
    },
  });

  const isManualOrder = (order: Order) => {
    const currency = (order.payCurrency || "").toLowerCase();
    return currency === "etransfer" || currency === "e-transfer" || currency === "shakepay";
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return <OrdersTableSkeleton />;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      order.orderId.toLowerCase().includes(searchLower) ||
      (order.productName && order.productName.toLowerCase().includes(searchLower)) ||
      (order.email && order.email.toLowerCase().includes(searchLower)) ||
      (order.sentStock && order.sentStock.toLowerCase().includes(searchLower)) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by ID, product, email, tracking, or stock sent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-orders"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="awaiting_manual">Awaiting Verification</SelectItem>
              <SelectItem value="confirming">Confirming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-orders"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync Status
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {orders.length === 0 ? "No orders yet" : "No matching orders"}
          </h3>
          <p className="text-muted-foreground">
            {orders.length === 0 
              ? "Orders will appear here when customers make purchases"
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-card-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Tracking</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary truncate max-w-[120px]">
                          {order.orderId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyText(order.orderId, "Order ID")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.productName?.includes(" items") ? (
                        <button
                          className="text-left group"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                          data-testid={`button-expand-order-${order.id}`}
                        >
                          <span className="font-medium text-primary text-sm truncate max-w-[150px] block group-hover:underline">
                            {order.productName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Click to {expandedOrderId === order.orderId ? "collapse" : "view items"}
                          </span>
                        </button>
                      ) : (
                        <>
                          <span className="font-medium text-foreground text-sm truncate max-w-[150px] block">
                            {order.productName || "Unknown Product"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Qty: {order.quantity}
                          </span>
                        </>
                      )}
                      {expandedOrderId === order.orderId && expandedItems && (
                        <div className="mt-2 space-y-1 border-t border-border pt-2">
                          {expandedItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span className="text-foreground">{item.productName}</span>
                              <span className="text-muted-foreground">x{item.quantity} @ ${Number(item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                        {order.email || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-foreground">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {order.payCurrency ? (
                        <Badge variant="outline" className="uppercase text-xs">
                          {order.payCurrency}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} border gap-1 text-xs`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono text-blue-400 truncate max-w-[120px]">
                            {order.trackingNumber}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => copyText(order.trackingNumber!, "Tracking")}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isManualOrder(order) && (order.status === "pending" || order.status === "awaiting_manual") && (
                          <AlertDialog open={verifyingOrder === order.orderId} onOpenChange={(open) => {
                            setVerifyingOrder(open ? order.orderId : null);
                            if (!open) setTrackingInputs(prev => { const next = {...prev}; delete next[order.orderId]; return next; });
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-500 hover:text-green-600 h-7 w-7"
                                title="Verify payment"
                                data-testid={`button-verify-order-${order.id}`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Verify Payment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Verify payment for order "{order.orderId}"?
                                  {order.payerContact && (
                                    <span className="block mt-1 font-medium text-foreground">
                                      Payer: {order.payerContact}
                                    </span>
                                  )}
                                  <span className="block mt-1">
                                    Amount: ${order.totalAmount.toFixed(2)} CAD via {order.payCurrency?.toUpperCase()}
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="px-6 pb-2">
                                <label className="text-sm font-medium text-foreground">
                                  Tracking Number <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder="Canada Post tracking number (required)"
                                  value={trackingInputs[order.orderId] || ""}
                                  onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.orderId]: e.target.value }))}
                                  className="mt-1.5"
                                  data-testid={`input-tracking-verify-${order.id}`}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  A tracking number is required to verify the order.
                                </p>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="button-cancel-verify">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const tn = trackingInputs[order.orderId]?.trim();
                                    if (tn) {
                                      verifyMutation.mutate({ orderId: order.orderId, trackingNumber: tn });
                                    }
                                  }}
                                  disabled={verifyMutation.isPending || !trackingInputs[order.orderId]?.trim()}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  data-testid="button-confirm-verify"
                                >
                                  {verifyMutation.isPending ? "Verifying..." : "Verify & Ship"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {order.status === "completed" && !order.trackingNumber && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-500 hover:text-blue-600 h-7 w-7"
                                title="Add tracking number"
                                data-testid={`button-add-tracking-${order.id}`}
                              >
                                <Package className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Add Tracking Number</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Add Canada Post tracking for order "{order.orderId}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="px-6 pb-2">
                                <Input
                                  placeholder="Canada Post tracking number"
                                  value={trackingInputs[order.orderId] || ""}
                                  onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.orderId]: e.target.value }))}
                                  data-testid={`input-tracking-add-${order.id}`}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const tn = trackingInputs[order.orderId]?.trim();
                                    if (tn) trackingMutation.mutate({ orderId: order.orderId, trackingNumber: tn });
                                  }}
                                  disabled={trackingMutation.isPending || !trackingInputs[order.orderId]?.trim()}
                                  data-testid="button-confirm-tracking"
                                >
                                  {trackingMutation.isPending ? "Saving..." : "Add Tracking"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {order.trackingNumber && (
                          <>
                            <AlertDialog open={editingTrackingOrder === order.orderId} onOpenChange={(open) => {
                              if (open) {
                                setEditingTrackingOrder(order.orderId);
                                setTrackingInputs(prev => ({ ...prev, [order.orderId]: order.trackingNumber || "" }));
                              } else {
                                setEditingTrackingOrder(null);
                              }
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-orange-500 hover:text-orange-600 h-7 w-7"
                                  title="Edit tracking number"
                                  data-testid={`button-edit-tracking-${order.id}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Edit Tracking Number</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Update tracking for order "{order.orderId}".
                                    <span className="block mt-1 text-orange-400">
                                      Current: {order.trackingNumber}
                                    </span>
                                    <span className="block mt-1 text-xs">
                                      The customer will receive an email notification about this change.
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="px-6 pb-2">
                                  <Input
                                    placeholder="New tracking number"
                                    value={trackingInputs[order.orderId] || ""}
                                    onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.orderId]: e.target.value }))}
                                    data-testid={`input-tracking-edit-${order.id}`}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      const tn = trackingInputs[order.orderId]?.trim();
                                      if (tn) trackingMutation.mutate({ orderId: order.orderId, trackingNumber: tn });
                                    }}
                                    disabled={trackingMutation.isPending || !trackingInputs[order.orderId]?.trim() || trackingInputs[order.orderId]?.trim() === order.trackingNumber}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    data-testid="button-confirm-edit-tracking"
                                  >
                                    {trackingMutation.isPending ? "Updating..." : "Update Tracking"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-purple-500 hover:text-purple-600 h-7 w-7"
                              title="View tracking history"
                              onClick={() => setHistoryOrderId(order.orderId)}
                              data-testid={`button-tracking-history-${order.id}`}
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-7 w-7"
                              data-testid={`button-delete-order-${order.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete order "{order.orderId}"? This will permanently remove it from the database and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete-order">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(order.id)}
                                disabled={deleteMutation.isPending}
                                className="bg-destructive text-destructive-foreground"
                                data-testid="button-confirm-delete-order"
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!historyOrderId} onOpenChange={(open) => { if (!open) setHistoryOrderId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Tracking History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mb-2">
            <p className="text-sm text-muted-foreground">
              Order: <code className="text-primary">{historyOrderId}</code>
            </p>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {trackingHistoryData && trackingHistoryData.length > 0 ? (
              trackingHistoryData.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-md border ${index === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <code className="text-sm font-mono text-blue-400">{entry.trackingNumber}</code>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">Current</Badge>
                    )}
                    {entry.previousTrackingNumber && (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-400">Edited</Badge>
                    )}
                  </div>
                  {entry.previousTrackingNumber && (
                    <p className="text-xs text-muted-foreground">
                      Previous: <s className="text-red-400">{entry.previousTrackingNumber}</s>
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      by {entry.editedBy}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.editedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No tracking history found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
