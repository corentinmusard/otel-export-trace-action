"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trace_1 = require("./trace");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const jest_mock_extended_1 = require("jest-mock-extended");
describe("createTracerProvider", () => {
    let subject;
    let mockWorkflowRunJobs;
    beforeEach(() => {
        jest.useFakeTimers();
        mockWorkflowRunJobs = (0, jest_mock_extended_1.mock)({
            workflowRun: {
                name: "workflow-name",
                workflow_id: 1,
                id: 1,
                repository: {
                    full_name: "test/repo",
                },
                head_sha: "head-sha",
            },
        });
    });
    afterEach(() => {
        jest.useRealTimers();
        return subject.shutdown();
    });
    describe("resource attributes", () => {
        it("has service.name resource as workflow name", () => {
            subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs);
            expect(subject.resource.attributes[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]).toEqual(mockWorkflowRunJobs.workflowRun.name);
        });
        it("has service.name resource as workflow id", () => {
            mockWorkflowRunJobs.workflowRun.name = null;
            subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs);
            expect(subject.resource.attributes[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]).toEqual(`${mockWorkflowRunJobs.workflowRun.id}`);
        });
        it("has service.name resource as a custom parameter", () => {
            subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs, "custom-service-name");
            expect(subject.resource.attributes[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]).toEqual("custom-service-name");
        });
        it("has service.instance.id resource", () => {
            subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs);
            expect(subject.resource.attributes[semantic_conventions_1.SemanticResourceAttributes.SERVICE_INSTANCE_ID]).toEqual([
                mockWorkflowRunJobs.workflowRun.repository.full_name,
                mockWorkflowRunJobs.workflowRun.workflow_id,
                mockWorkflowRunJobs.workflowRun.id,
                mockWorkflowRunJobs.workflowRun.run_attempt,
            ].join("/"));
        });
        it("has service.namespace resource", () => {
            subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs);
            expect(subject.resource.attributes[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAMESPACE]).toEqual(mockWorkflowRunJobs.workflowRun.repository.full_name);
        });
    });
    it("has active span processor", () => {
        subject = (0, trace_1.createTracerProvider)("localhost", "test=foo", mockWorkflowRunJobs);
        const spanProcessor = subject.getActiveSpanProcessor();
        expect(spanProcessor).toBeDefined();
    });
    it("supports https", () => {
        subject = (0, trace_1.createTracerProvider)("https://localhost", "test=foo", mockWorkflowRunJobs);
        const spanProcessor = subject.getActiveSpanProcessor();
        expect(spanProcessor).toBeDefined();
    });
});
//# sourceMappingURL=trace.test.js.map