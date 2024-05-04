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
exports.traceWorkflowRunStep = void 0;
const core = __importStar(require("@actions/core"));
const api_1 = require("@opentelemetry/api");
const trace_otlp_file_1 = require("./trace-otlp-file");
async function traceWorkflowRunStep({ job, parentContext, parentSpan, trace, tracer, workflowArtifacts, step, }) {
    if (!step || !step.completed_at || !step.started_at) {
        const stepName = step?.name || "UNDEFINED";
        console.warn(`Step ${stepName} is not completed yet.`);
        return;
    }
    if (step.conclusion == "cancelled" || step.conclusion == "skipped") {
        console.info(`Step ${step.name} did not run.`);
        return;
    }
    core.debug(`Trace Step ${step.name}`);
    const ctx = trace.setSpan(parentContext, parentSpan);
    const startTime = new Date(step.started_at);
    const completedTime = new Date(step.completed_at);
    const span = tracer.startSpan(step.name, {
        attributes: {
            "github.job.step.name": step.name,
            "github.job.step.number": step.number,
            "github.job.step.started_at": step.started_at || undefined,
            "github.job.step.completed_at": step.completed_at || undefined,
            "github.job.step.id": step.id,
            error: step.conclusion === "failure",
        },
        startTime,
    }, ctx);
    const spanId = span.spanContext().spanId;
    try {
        span.setStatus({ code: api_1.SpanStatusCode.ERROR });
        if (step.conclusion !== "failure") {
            span.setStatus({ code: api_1.SpanStatusCode.OK });
        }
        core.debug(`Step Span<${spanId}>: Started<${step.started_at}>`);
        if (step.conclusion) {
            span.setAttribute("github.job.step.conclusion", step.conclusion);
        }
        await traceArtifact({
            tracer,
            parentSpan: span,
            job,
            step,
            startTime,
            workflowArtifacts,
        });
    }
    finally {
        core.debug(`Step Span<${spanId}>: Ended<${step.completed_at}>`);
        // Some skipped and post jobs return completed_at dates that are older than started_at
        span.end(new Date(Math.max(startTime.getTime(), completedTime.getTime())));
    }
}
exports.traceWorkflowRunStep = traceWorkflowRunStep;
async function traceArtifact({ tracer, parentSpan, job, step, startTime, workflowArtifacts, }) {
    const artifact = workflowArtifacts(job.name, step.name);
    if (artifact) {
        core.debug(`Found Artifact ${artifact?.path}`);
        await (0, trace_otlp_file_1.traceOTLPFile)({
            tracer,
            parentSpan,
            startTime,
            path: artifact.path,
        });
    }
    else {
        core.debug(`No Artifact to trace for Job<${job.name}> Step<${step.name}>`);
    }
}
//# sourceMappingURL=step.js.map