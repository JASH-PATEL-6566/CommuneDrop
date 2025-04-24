"use client";

// Update the DeliveryHistorySection component to fetch and display real order data
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  ChevronRight,
  CheckCircle,
  Calendar,
  Package,
  DollarSign,
  AlertTriangle,
  Filter,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/order-service";

interface OrderItem {
  _id: string;
  from_address: string;
  to_address: string;
  status: string;
  package_weight: number;
  vehicle_type: string;
  distance: number;
  time: number;
  createdAt: string;
  updatedAt: string;
  pricing_details: {
    cost: number;
    tax: number;
    total_cost: number;
    rider_commission: number;
  };
}

export default function DeliveryHistorySection() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Add state for filtering and sorting
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // newest first by default

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await orderService.getUserOrders();

        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          setError(response.message || "Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("An error occurred while fetching your orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDER PLACED":
        return "bg-blue-100 text-blue-800";
      case "ORDER CONFIRMED":
        return "bg-green-100 text-green-800";
      case "IN TRANSIT":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format date
  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    orders.forEach((order) => {
      if (order.status) {
        statuses.add(order.status);
      }
    });
    return Array.from(statuses);
  }, [orders]);

  // Apply filters and sorting
  const filteredAndSortedOrders = useMemo(() => {
    // First apply status filter
    const result = statusFilter
      ? orders.filter((order) => order.status === statusFilter)
      : orders;

    // Then apply sorting
    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortDirection === "asc"
        ? dateA - dateB // oldest first
        : dateB - dateA; // newest first
    });
  }, [orders, statusFilter, sortDirection]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Delivery History</h2>
      <div className="border-t border-gray-200 mb-6"></div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          <select
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleSortDirection}
          className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          aria-label={`Sort by time ${
            sortDirection === "asc" ? "newest first" : "oldest first"
          }`}
        >
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          <span>Sort by Time</span>
          <ArrowUpDown
            className={`w-4 h-4 ml-2 text-gray-500 transition-transform ${
              sortDirection === "asc" ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="p-4 border rounded-lg animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="h-3 w-10 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>

                <div>
                  <div className="h-3 w-10 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="text-center py-12">
          {statusFilter ? (
            <>
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                No deliveries found with status: {statusFilter}
              </p>
              <button
                onClick={() => setStatusFilter(null)}
                className="text-primary text-sm hover:underline"
              >
                View all deliveries
              </button>
            </>
          ) : (
            <>
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No delivery history found</p>
              <p className="text-sm text-gray-400">
                Your deliveries will appear here once you place an order
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order, index) => (
            <motion.div
              key={order._id}
              className="p-4 border rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    #{order._id.substring(order._id.length - 8)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {order.status}
                  </span>
                </div>
                <span className="text-gray-500 text-sm flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatOrderDate(order.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <div className="text-sm flex items-start">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                    {order.from_address}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <div className="text-sm flex items-start">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
                    {order.to_address}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 flex items-center">
                    <Package className="w-4 h-4 text-gray-500 mr-1" />
                    {order.package_weight} kg
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.vehicle_type.toLowerCase()}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />$
                    {order.pricing_details.total_cost.toFixed(2)}
                  </div>
                </div>
                <button className="text-primary text-sm font-medium hover:underline flex items-center">
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
