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
exports.createTracerProvider = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const resources_1 = require("@opentelemetry/resources");
const OTEL_CONSOLE_ONLY = process.env["OTEL_CONSOLE_ONLY"] === "true";
function stringToHeader(value) {
    const pairs = value.split(",");
    return pairs.reduce((result, item) => {
        const [key, value] = item.split("=");
        if (key && value) {
            return {
                ...result,
                [key.trim()]: value.trim(),
            };
        }
        // istanbul ignore next
        return result;
    }, {});
}
function isHttpEndpoint(endpoint) {
    return endpoint.startsWith("https://");
}
function createTracerProvider(otlpEndpoint, otlpHeaders, workflowRunJobs, otelServiceName) {
    const serviceName = otelServiceName ||
        workflowRunJobs.workflowRun.name ||
        `${workflowRunJobs.workflowRun.workflow_id}`;
    const serviceInstanceId = [
        workflowRunJobs.workflowRun.repository.full_name,
        workflowRunJobs.workflowRun.workflow_id,
        workflowRunJobs.workflowRun.id,
        workflowRunJobs.workflowRun.run_attempt,
    ].join("/");
    const serviceNamespace = workflowRunJobs.workflowRun.repository.full_name;
    const serviceVersion = workflowRunJobs.workflowRun.head_sha;
    const provider = new sdk_trace_base_1.BasicTracerProvider({
        resource: new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_INSTANCE_ID]: serviceInstanceId,
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAMESPACE]: serviceNamespace,
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        }),
    });
    let exporter = new sdk_trace_base_1.ConsoleSpanExporter();
    if (!OTEL_CONSOLE_ONLY) {
        if (isHttpEndpoint(otlpEndpoint)) {
            exporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
                url: otlpEndpoint,
                headers: stringToHeader(otlpHeaders),
            });
        }
        else {
            exporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
                url: otlpEndpoint,
                credentials: grpc.credentials.createSsl(),
                metadata: grpc.Metadata.fromHttp2Headers(stringToHeader(otlpHeaders)),
            });
        }
    }
    provider.addSpanProcessor(new sdk_trace_base_1.BatchSpanProcessor(exporter));
    provider.register();
    return provider;
}
exports.createTracerProvider = createTracerProvider;
//# sourceMappingURL=trace.js.map