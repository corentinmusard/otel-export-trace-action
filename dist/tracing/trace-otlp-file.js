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
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const core_1 = require("@opentelemetry/core");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const api = __importStar(require("@opentelemetry/api"));
/* istanbul ignore next */
function toSpanKind(spanKind) {
    switch (spanKind) {
        /* istanbul ignore next */
        case exporter_trace_otlp_http_1.otlpTypes.opentelemetryProto.trace.v1.Span.SpanKind.SPAN_KIND_CLIENT:
            return api.SpanKind.CLIENT;
        /* istanbul ignore next */
        case exporter_trace_otlp_http_1.otlpTypes.opentelemetryProto.trace.v1.Span.SpanKind.SPAN_KIND_CONSUMER:
            return api.SpanKind.CONSUMER;
        case exporter_trace_otlp_http_1.otlpTypes.opentelemetryProto.trace.v1.Span.SpanKind.SPAN_KIND_INTERNAL:
            return api.SpanKind.INTERNAL;
        /* istanbul ignore next */
        case exporter_trace_otlp_http_1.otlpTypes.opentelemetryProto.trace.v1.Span.SpanKind.SPAN_KIND_PRODUCER:
            return api.SpanKind.PRODUCER;
        /* istanbul ignore next */
        case exporter_trace_otlp_http_1.otlpTypes.opentelemetryProto.trace.v1.Span.SpanKind.SPAN_KIND_SERVER:
            return api.SpanKind.SERVER;
        /* istanbul ignore next */
        default:
            return api.SpanKind.INTERNAL;
    }
}
function toLinks(links) {
    /* istanbul ignore if */
    if (links === undefined) {
        return undefined;
    }
    // TODO implement Links
    return undefined;
}
function toAttributeValue(value) {
    /* istanbul ignore else */
    if ("stringValue" in value) {
        return value.stringValue;
    }
    else if ("arrayValue" in value) {
        return JSON.stringify(value.arrayValue?.values);
    }
    else if ("boolValue" in value) {
        return value.boolValue;
    }
    else if ("doubleValue" in value) {
        return value.doubleValue;
    }
    else if ("intValue" in value) {
        return value.intValue;
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
function toSpan({ otlpSpan, tracer, parentSpan }) {
    return new sdk_trace_base_1.Span(tracer, api.context.active(), otlpSpan.name, {
        traceId: parentSpan.spanContext().traceId,
        spanId: otlpSpan.spanId,
        traceFlags: parentSpan.spanContext().traceFlags,
        traceState: new core_1.TraceState(otlpSpan.traceState),
    }, toSpanKind(otlpSpan.kind), otlpSpan.parentSpanId || parentSpan.spanContext().spanId, toLinks(otlpSpan.links), new Date(otlpSpan.startTimeUnixNano / 1000000));
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
            for (const resourceSpans of serviceRequest.resourceSpans) {
                for (const libSpans of resourceSpans.instrumentationLibrarySpans) {
                    if (libSpans.instrumentationLibrary) {
                        for (const otlpSpan of libSpans.spans) {
                            core.debug(`Trace Test ParentSpan<${otlpSpan.parentSpanId || parentSpan.spanContext().spanId}> -> Span<${otlpSpan.spanId}> `);
                            const span = toSpan({
                                otlpSpan,
                                tracer,
                                parentSpan,
                            });
                            const attributes = toAttributes(otlpSpan.attributes);
                            if (attributes) {
                                span.setAttributes(attributes);
                            }
                            if (otlpSpan.status) {
                                span.setStatus(otlpSpan.status);
                            }
                            span.end(new Date(otlpSpan.endTimeUnixNano / 1000000));
                        }
                    }
                }
            }
        }
    }
}
exports.traceOTLPFile = traceOTLPFile;
//# sourceMappingURL=trace-otlp-file.js.map