All of the client side static files are hosted within apache (images, html, etc.).

Any query for serverside state information are passed to node.

Any request for a message that would be pulled out of redis is passed to node

The query scheme matches rest API.
All responses fit JSON formatting

See "Gateway-client API.md" for more detailed information on the query contents and API scheme.


