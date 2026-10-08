import { AppError } from '../utils/app-error.js';

/**
 * Validates req[source] with a zod schema and stores the parsed result in req.validated[source].
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new AppError(400, 'Los datos enviados no son válidos', errors));
    }
    req.validated = { ...req.validated, [source]: result.data };
    return next();
  };
}
