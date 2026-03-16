import { computeGridKey } from "./reports.duplicate";
import { calculateConfidenceFromVotes } from "./reports.confidence";
import ReportsRepository, {
  type ModerationAction,
  type ModerateReportStatus,
  type ReportRow,
  type VoteSummary,
  type VoteValue,
} from "./reports.repository";
import type { CreateReportInput, ModerateReportInput, VoteReportInput } from "./reports.validation";

export type CreateReportServiceInput = CreateReportInput & {
  userId: number;
};

export class ReportsService {
  private readonly repository = new ReportsRepository();

  private async getExistingReport(reportId: number): Promise<ReportRow> {
    const report = await this.repository.findById(reportId);
    if (!report) {
      const err: Error & { status?: number } = new Error("Report not found");
      err.status = 404;
      throw err;
    }
    return report;
  }

  async createReport(input: CreateReportServiceInput): Promise<ReportRow> {
    const gridKey = computeGridKey(input.lat, input.lng);
    const reportedAt = input.reportedAt ? new Date(input.reportedAt) : new Date();
    const createdReport = await this.repository.createReport({
      userId: input.userId,
      category: input.category,
      description: input.description,
      lat: input.lat,
      lng: input.lng,
      gridKey,
      reportedAt,
    });

    // Step 2: check if the new report should be merged as a duplicate.
    const candidate = await this.repository.findDuplicateCandidate(
      input.category,
      gridKey,
      reportedAt,
      60,
      createdReport.id
    );

    if (!candidate) {
      return createdReport;
    }

    await this.repository.markReportMergedAsDuplicate(createdReport.id, candidate.id);
    await this.repository.incrementConfidence(candidate.id, 10);

    const mergedReport = await this.repository.findById(createdReport.id);
    if (!mergedReport) {
      throw new Error("Failed to fetch merged report");
    }

    return mergedReport;
  }

  async detectDuplicate(reportId: number): Promise<void> {
    // TODO: detect potential duplicates for the given report
    void reportId;
  }

  async calculateConfidence(reportId: number): Promise<void> {
    // TODO: calculate confidence score for the given report
    void reportId;
  }

  async voteReport(reportId: number, userId: number, value: VoteValue): Promise<VoteSummary> {
    const report = await this.getExistingReport(reportId);
    if (report.status === "MERGED" && report.duplicate_of_report_id !== null) {
      // Votes must go to the canonical (primary) report to avoid split voting.
      const err: Error & { status?: number; primaryReportId?: number } = new Error(
        "Cannot vote on a merged report. Vote on the primary report instead."
      );
      err.status = 409;
      err.primaryReportId = report.duplicate_of_report_id;
      throw err;
    }

    await this.repository.upsertVote(reportId, userId, value);

    const counts = await this.repository.getVoteCounts(reportId);
    const score = calculateConfidenceFromVotes(counts.upvotes, counts.downvotes);

    await this.repository.updateReportConfidence(reportId, score);

    return {
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score,
    };
  }

  async getVoteSummary(reportId: number): Promise<VoteSummary> {
    const report = await this.getExistingReport(reportId);
    // For read endpoints, resolve merged reports to their primary report for better UX.
    const targetReportId =
      report.status === "MERGED" && report.duplicate_of_report_id !== null
        ? report.duplicate_of_report_id
        : reportId;

    const counts = await this.repository.getVoteCounts(targetReportId);
    const score = await this.repository.getReportConfidence(targetReportId);

    return {
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score,
    };
  }

  async moderateReport(
    reportId: number,
    actorUserId: number,
    action: ModerationAction,
    reason?: string
  ): Promise<ReportRow> {
    const currentReport = await this.repository.getReportByIdForUpdate(reportId);
    if (!currentReport) {
      const err: Error & { status?: number } = new Error("Report not found");
      err.status = 404;
      throw err;
    }

    const statusMap: Record<ModerationAction, ModerateReportStatus> = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      MARK_SPAM: "SPAM",
    };
    const newStatus = statusMap[action];

    await this.repository.updateReportStatus(reportId, newStatus);

    await this.repository.insertModerationLog({
      actor_user_id: actorUserId,
      action,
      target_id: reportId,
      reason,
      before_snapshot: JSON.stringify(currentReport),
      after_snapshot: JSON.stringify({ ...currentReport, status: newStatus }),
    });

    const updatedReport = await this.repository.findById(reportId);
    if (!updatedReport) {
      const err: Error & { status?: number } = new Error("Report not found");
      err.status = 404;
      throw err;
    }

    return updatedReport;
  }

  async vote(input: VoteReportInput): Promise<void> {
    void input;
  }

  async moderate(input: ModerateReportInput): Promise<void> {
    // TODO: execute moderation action and audit logging
    void input;
  }
}

export default ReportsService;
