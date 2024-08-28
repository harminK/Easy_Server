// httpStatusCodes.js

export default {
  SUCCESS: 200, // Standard response for successful HTTP requests
  CREATED: 201, // The request has been fulfilled, resulting in the creation of a new resource
  ACCEPTED: 202, // Request has been accepted but not yet processed
  NO_CONTENT: 204, // The server successfully processed the request but there is no new information to send back
  RESET_CONTENT: 205, // Used in conjunction with a PUT or POST request, indicating that the current request should be reset
  PARTIAL_CONTENT: 206, // Used for partial GET requests

  BAD_REQUEST: 400, // The server cannot or will not process the request due to something that is perceived to be a client error
  UNAUTHORIZED: 401, // Similar to 403, but specifically for authentication purposes
  PAYMENT_REQUIRED: 402, // Reserved for future use
  FORBIDDEN: 403, // The client does not have access rights to the content
  NOT_FOUND: 404, // The server cannot find the requested resource
  METHOD_NOT_ALLOWED: 405, // The method specified in the request is not allowed for the resource identified by the request URI
  CONFLICT: 409, // Indicates that the request could not be processed because of conflict in the current state of the resource
  GONE: 410, // The requested resource is no longer available at the server and no forwarding address is known
  LENGTH_REQUIRED: 411, // The server refuses to accept the request without a defined Content-Length

  INTERNAL_SERVER_ERROR: 500, // A generic error message returned when an unexpected condition was encountered
  NOT_IMPLEMENTED: 501, // The server does not support the functionality required to fulfill the request
  BAD_GATEWAY: 502, // The server, while acting as a gateway or proxy, received an invalid response from an inbound server it accessed
  SERVICE_UNAVAILABLE: 503, // The server is not ready to handle the request
  GATEWAY_TIMEOUT: 504, // The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server
  HTTP_VERSION_NOT_SUPPORTED: 505, // The server does not support the HTTP protocol version used in the request
  VARIANT_ALSO_NEGOTIATES: 506, // Transparent content negotiation for the request results in a circular reference
  INSUFFICIENT_STORAGE: 507, // The server is unable to store the representation needed to complete the request

  UNPROCESSABLE_ENTITY: 422, // The server understands the content type of the request entity but was unable to process the contained instructions
  LOCKED: 423, // The resource that is being accessed is locked
  FAILED_DEPENDENCY: 424, // The method could not be performed on the resource because the requested action depended on another action and that action failed

  // Custom status codes (example)
  TOO_MANY_REQUESTS: 429, // Rate limiting, indicating that the client has sent too many requests in a given amount of time
};
