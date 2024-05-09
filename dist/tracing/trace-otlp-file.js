"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceOTLPFile = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const api_1 = require("@opentelemetry/api");
const otlp_transformer_1 = require("@opentelemetry/otlp-transformer");
/* istanbul ignore next */
function toSpanKind(spanKind) {
    switch (spanKind) {
        /* istanbul ignore next */
        case otlp_transformer_1.ESpanKind.SPAN_KIND_CLIENT:
            return api_1.SpanKind.CLIENT;
        /* istanbul ignore next */
        case otlp_transformer_1.ESpanKind.SPAN_KIND_CONSUMER:
            return api_1.SpanKind.CONSUMER;
        case otlp_transformer_1.ESpanKind.SPAN_KIND_INTERNAL:
            return api_1.SpanKind.INTERNAL;
        /* istanbul ignore next */
        case otlp_transformer_1.ESpanKind.SPAN_KIND_PRODUCER:
            return api_1.SpanKind.PRODUCER;
        /* istanbul ignore next */
        case otlp_transformer_1.ESpanKind.SPAN_KIND_SERVER:
            return api_1.SpanKind.SERVER;
        /* istanbul ignore next */
        default:
            return api_1.SpanKind.INTERNAL;
    }
}
function toLinks(links) {
    /* istanbul ignore if */
    if (links === undefined) {
        return [];
    }
    // TODO implement Links
    return [];
}
function toAttributeValue(value) {
    /* istanbul ignore else */
    if ("stringValue" in value) {
        /* istanbul ignore next */
        return value.stringValue ?? undefined;
    }
    else if ("arrayValue" in value) {
        return JSON.stringify(value.arrayValue?.values);
    }
    else if ("boolValue" in value) {
        return value.boolValue ?? undefined;
    }
    else if ("doubleValue" in value) {
        return value.doubleValue ?? undefined;
    }
    else if ("intValue" in value) {
        return value.intValue ?? undefined;
    }
    else if ("kvlistValue" in value) {
        return JSON.stringify(value.kvlistValue?.values.reduce((result, { key, value }) => {
            return { ...result, [key]: toAttributeValue(value) };
        }, {}));
    }
    /* istanbul ignore next */
    return undefined;
}
function toAttributes(attributes) {
    /* istanbul ignore if */
    if (!attributes) {
        return {};
    }
    const rv = attributes.reduce((result, { key, value }) => {
        return { ...result, [key]: toAttributeValue(value) };
    }, {});
    return rv;
}
function addSpanToTracer(otlpSpan, tracer) {
    const span = tracer.startSpan(otlpSpan.name, {
        kind: toSpanKind(otlpSpan.kind),
        attributes: toAttributes(otlpSpan.attributes),
        links: toLinks(otlpSpan.links),
        startTime: new Date(otlpSpan.startTimeUnixNano / 1000000),
    }, api_1.context.active());
    if (otlpSpan.status) {
        span.setStatus({
            code: otlpSpan.status.code,
            message: otlpSpan.status.message ?? "",
        });
    }
    span.end(new Date(otlpSpan.endTimeUnixNano / 1000000));
}
async function traceOTLPFile({ tracer, parentSpan, path, }) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    for await (const line of rl) {
        if (line) {
            const serviceRequest = JSON.parse(line);
            /* istanbul ignore next */
            for (const resourceSpans of serviceRequest.resourceSpans ?? []) {
                /* istanbul ignore next */
                for (const scopeSpans of resourceSpans.scopeSpans ?? []) {
                    if (scopeSpans.scope) {
                        /* istanbul ignore next */
                        for (const otlpSpan of scopeSpans.spans ?? []) {
                            core.debug(`Trace Test ParentSpan<${otlpSpan.parentSpanId?.toString() ||
                                parentSpan.spanContext().spanId}> -> Span<${otlpSpan.spanId.toString()}> `);
                            addSpanToTracer(otlpSpan, tracer);
                        }
                    }
                }
            }
        }
    }
}
exports.traceOTLPFile = traceOTLPFile;
//# sourceMappingURL=trace-otlp-file.js.map