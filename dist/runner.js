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
exports.run = void 0;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const github_1 = require("./github");
const tracing_1 = require("./tracing");
async function run() {
    const ghContext = github.context;
    const otlpEndpoint = core.getInput("otlpEndpoint");
    const otlpHeaders = core.getInput("otlpHeaders");
    const otelServiceName = core.getInput("otelServiceName") || process.env["OTEL_SERVICE_NAME"] || "";
    const runId = parseInt(core.getInput("runId") || `${ghContext.runId}`);
    const ghToken = core.getInput("githubToken") || process.env["GITHUB_TOKEN"] || "";
    const octokit = github.getOctokit(ghToken);
    core.info(`Get Workflow Run Jobs for ${runId}`);
    const workflowRunJobs = await (0, github_1.getWorkflowRunJobs)(ghContext, octokit, runId);
    core.info(`Create Trace Provider for ${otlpEndpoint}`);
    const provider = (0, tracing_1.createTracerProvider)(otlpEndpoint, otlpHeaders, workflowRunJobs, otelServiceName);
    try {
        core.info(`Trace Workflow Run Jobs for ${runId} and export to ${otlpEndpoint}`);
        const spanContext = await (0, tracing_1.traceWorkflowRunJobs)({
            provider,
            workflowRunJobs,
        });
        core.setOutput("traceId", spanContext.traceId);
    }
    finally {
        core.info("Shutdown Trace Provider");
        setTimeout(() => {
            provider
                .shutdown()
                .then(() => {
                core.info("Provider shutdown");
            })
                .catch((error) => {
                console.warn(error.message);
            });
        }, 2000);
    }
}
exports.run = run;
//# sourceMappingURL=runner.js.map