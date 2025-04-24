export enum OrderEvent{
    CREATE_ORDER = "create_order",
    CANCLE_ORDER = "cancel_order",
    STATUS_CHANGED = "status_changed"  // More generic event for status changes
}

export type TOPIC_TYPE = "OrderDeliveryRequests"

export interface MessageType {
    headers? : Record<string, any>;
    event: OrderEvent;
    data: Record<string, any>;    
}