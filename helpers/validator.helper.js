const { Types: { ObjectId } } = require("mongoose");

/**
 * Lightweight request validation.
 *
 * Schema: { field: { type, required, enum, min, max, maxDecimals, maxLength, pattern, label } }
 * type: "objectId" | "number" | "integer" | "string" | "date" | "object"
 * Only the fields listed in the schema are kept in req[source]; anything else is dropped.
 */

const isEmpty = (value) => value === undefined || value === null || (typeof value === "string" && value.trim() === "");

const decimalsOf = (num) => {
  const str = String(num);
  if (str.includes("e-")) return Number(str.split("e-")[1]);
  return str.includes(".") ? str.split(".")[1].length : 0;
};

const checkField = (name, rule, raw) => {
  const label = rule.label || name;

  if (isEmpty(raw)) {
    if (rule.required) return { error: `${label} is required` };
    return { value: rule.default };
  }

  let value = raw;
  switch (rule.type) {
    case "objectId":
      if (typeof value !== "string" || !ObjectId.isValid(value) || String(new ObjectId(value)) !== value.toLowerCase()) {
        return { error: `Invalid ${label}` };
      }
      break;
    case "number":
    case "integer": {
      if (typeof value === "boolean" || (typeof value === "string" && !/^-?\d+(\.\d+)?$/.test(value.trim()))) {
        return { error: `${label} must be a number` };
      }
      value = Number(value);
      if (!Number.isFinite(value)) return { error: `${label} must be a number` };
      if (rule.type === "integer" && !Number.isInteger(value)) return { error: `${label} must be a whole number` };
      if (rule.min !== undefined && value < rule.min) return { error: `${label} must be at least ${rule.min}` };
      if (rule.gt !== undefined && value <= rule.gt) return { error: `${label} must be greater than ${rule.gt}` };
      if (rule.max !== undefined && value > rule.max) return { error: `${label} must not exceed ${rule.max}` };
      if (rule.maxDecimals !== undefined && decimalsOf(value) > rule.maxDecimals) {
        return { error: `${label} allows at most ${rule.maxDecimals} decimal places` };
      }
      break;
    }
    case "string":
      if (typeof value !== "string") return { error: `${label} must be a string` };
      value = value.trim();
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return { error: `${label} must not exceed ${rule.maxLength} characters` };
      }
      if (rule.pattern && !rule.pattern.test(value)) return { error: `Invalid ${label}` };
      break;
    case "date": {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return { error: `Invalid ${label}` };
      value = date;
      break;
    }
    case "object":
      if (typeof value !== "object" || Array.isArray(value)) return { error: `Invalid ${label}` };
      break;
    default:
      break;
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return { error: `${label} must be one of: ${rule.enum.join(", ")}` };
  }
  return { value };
};

const validateObject = (schema, input = {}) => {
  const clean = {};
  for (const [name, rule] of Object.entries(schema)) {
    const { error, value } = checkField(name, rule, input ? input[name] : undefined);
    if (error) return { error };
    if (value !== undefined) clean[name] = value;
  }
  return { value: clean };
};

const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = validateObject(schema, req[source]);
  if (error) return res.status(400).json({ status: false, message: error });
  req[source] = value;
  next();
};

module.exports = { validate, validateObject };
