import { serve } from "inngest/node";
import { inngest, functions } from "../inngest/index.js";

export default serve({
  client: inngest,
  functions,
});
