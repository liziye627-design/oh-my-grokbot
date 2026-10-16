import { CoreError } from "../errors.js";
export class GatewayError extends CoreError {
  constructor(
    code: string,
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 = 409,
  ) {
    super(code, message);
  }
}
