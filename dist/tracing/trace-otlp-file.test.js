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
const path = __importStar(require("path"));
const api = __importStar(require("@opentelemetry/api"));
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const trace_otlp_file_1 = require("./trace-otlp-file");
describe("traceJunitArtifact", () => {
    let memoryExporter;
    let tracerProvider;
    let tracer;
    beforeAll(() => {
        memoryExporter = new sdk_trace_base_1.InMemorySpanExporter();
        tracerProvider = new sdk_trace_base_1.BasicTracerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SEMRESATTRS_SERVICE_NAME]: "traceTestReportArtifact",
            }),
        });
        tracerProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(memoryExporter));
        tracerProvider.register();
        tracer = tracerProvider.getTracer("default");
    });
    beforeEach(() => {
        memoryExporter.reset();
    });
    afterEach(() => {
        // clear require cache
        Object.keys(require.cache).forEach((key) => delete require.cache[key]);
    });
    afterAll(() => {
        return tracerProvider.shutdown();
    });
    it("testsuites otlp trace", async () => {
        const junitFilePath = path.join("src", "tracing", "__assets__", "testsuites-trace.otlp");
        const startTime = new Date("2022-01-22T04:45:30");
        const span = tracer.startSpan("traceTestReportArtifact", { startTime, root: true, attributes: { root: true } }, api.ROOT_CONTEXT);
        await (0, trace_otlp_file_1.traceOTLPFile)({
            tracer,
            parentSpan: span,
            startTime,
            path: junitFilePath,
        });
        span.end(new Date("2022-01-22T04:45:34"));
        const spans = memoryExporter.getFinishedSpans();
        expect(spans.length).toEqual(9);
        spans.forEach((s) => {
            expect(s.attributes).toBeDefined();
            expect(Object.keys(s.attributes).length).toBeGreaterThan(0);
            expect(s.endTime).toBeDefined();
            expect(s.startTime).toBeDefined();
            expect(s.endTime[0]).toBeGreaterThanOrEqual(s.startTime[0]);
            expect(s.endTime[1]).toBeGreaterThanOrEqual(s.startTime[1]);
            expect(s.status).toBeDefined();
            if (s.status.code === api.SpanStatusCode.ERROR) {
                expect(s.attributes["error"]).toBeTruthy();
            }
            else {
                expect(s.attributes["error"]).toBeFalsy();
            }
        });
    });
    it("testsuite otlp trace", async () => {
        const junitFilePath = path.join("src", "tracing", "__assets__", "testsuite-trace.otlp");
        const startTime = new Date("2022-01-22T04:45:30");
        const span = tracer.startSpan("traceTestReportArtifact", { startTime, root: true, attributes: { root: true } }, api.ROOT_CONTEXT);
        await (0, trace_otlp_file_1.traceOTLPFile)({
            tracer,
            parentSpan: span,
            startTime,
            path: junitFilePath,
        });
        span.end(new Date("2022-01-22T04:45:34"));
        const spans = memoryExporter.getFinishedSpans();
        expect(spans.length).toEqual(7);
        spans.forEach((s) => {
            expect(s.attributes).toBeDefined();
            expect(Object.keys(s.attributes).length).toBeGreaterThan(0);
            expect(s.endTime).toBeDefined();
            expect(s.startTime).toBeDefined();
            expect(s.endTime[0]).toBeGreaterThanOrEqual(s.startTime[0]);
            expect(s.endTime[1]).toBeGreaterThanOrEqual(s.startTime[1]);
            expect(s.status).toBeDefined();
            if (s.status.code === api.SpanStatusCode.ERROR) {
                expect(s.attributes["error"]).toBeTruthy();
            }
            else {
                expect(s.attributes["error"]).toBeFalsy();
            }
        });
    });
    it("test failed otlp trace", async () => {
        const junitFilePath = path.join("src", "tracing", "__assets__", "fail-test-trace.otlp");
        const startTime = new Date("2022-02-01T18:37:11");
        const span = tracer.startSpan("traceTestReportArtifact", { startTime, root: true, attributes: { root: true } }, api.ROOT_CONTEXT);
        await (0, trace_otlp_file_1.traceOTLPFile)({
            tracer,
            parentSpan: span,
            startTime,
            path: junitFilePath,
        });
        span.end(new Date("2022-02-01T18:37:14"));
        const spans = memoryExporter.getFinishedSpans();
        expect(spans.length).toEqual(14);
        spans.forEach((s) => {
            expect(s.attributes).toBeDefined();
            expect(Object.keys(s.attributes).length).toBeGreaterThan(0);
            expect(s.endTime).toBeDefined();
            expect(s.startTime).toBeDefined();
            expect(s.endTime[0]).toBeGreaterThanOrEqual(s.startTime[0]);
            expect(s.endTime[1]).toBeGreaterThanOrEqual(s.startTime[1]);
            expect(s.status).toBeDefined();
            if (s.status.code === api.SpanStatusCode.ERROR) {
                expect(s.attributes["error"]).toBeTruthy();
            }
            else {
                expect(s.attributes["error"]).toBeFalsy();
            }
        });
    });
});
//# sourceMappingURL=trace-otlp-file.test.js.map