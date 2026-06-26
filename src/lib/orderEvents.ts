import { EventEmitter } from "events";

const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(200);

export default orderEvents;
