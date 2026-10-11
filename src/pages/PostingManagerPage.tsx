import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  postingApi,
  HospitalSummary,
  MonthlyDb,
  RowResult,
  UpdatePreview,
  CommitPreviewItem,
  StructuredImportData,
  CommitImportResult,
} from "../utils/postingApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// =============================================================================
// 타입 (로컬 form state)
// =============================================================================

interface HospitalFormCard {
  id: string;
  hospitalPageId: string;
  hospitalName: string;
  keywords: string[];
  emphasis: string;
}

/**
 * 미리보기에서 받은 row를 사용자가 편집 가능하게 보관.
 */
interface EditableRow {
  rowId: string; // local UUID (UI key)
  hospitalPageId: string;
  hospitalSelectName: string;
  hospitalName: string;
  keyword: string;
  // editable fields
  title: string;
  additionalNote: string;
  pageBodyMarkdown: string;
  // ref-only
  matchedTreatments: string[];
  matchedPersonas: string[];
  matchedMetaphors: string[];
  matchedDifferentiators: string[];
  matchingNote: string;
  warnings: string[];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function rowResultToEditable(r: RowResult): EditableRow {
  return {
    rowId: uid(),
    hospitalPageId: r.hospitalPageId,
    hospitalSelectName: r.hospitalSelectName,
    hospitalName: r.hospitalName,
    keyword: r.keyword,
    title: r.preview.title,
    additionalNote: r.preview.additionalNote,
    pageBodyMarkdown: r.preview.pageBodyMarkdown,
    matchedTreatments: r.preview.matchedTreatments,
    matchedPersonas: r.preview.matchedPersonas,
    matchedMetaphors: r.preview.matchedMetaphors,
    matchedDifferentiators: r.preview.matchedDifferentiators,
    matchingNote: r.preview.matchingNote,
    warnings: r.warnings,
  };
}

// =============================================================================
// 글 생성 탭
// =============================================================================

function GenerateTab({
  hospitals,
  monthlyDbs,
}: {
  hospitals: HospitalSummary[];
  monthlyDbs: MonthlyDb[];
}) {
  const [cards, setCards] = useState<HospitalFormCard[]>([
    { id: uid(), hospitalPageId: "", hospitalName: "", keywords: [""], emphasis: "" },
  ]);
  const [monthlyDbId, setMonthlyDbId] = useState<string | undefined>(
    monthlyDbs[0]?.databaseId,
  );
  const [busy, setBusy] = useState(false);
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
  const [errors, setErrors] = useState<
    Array<{ hospitalPageId: string; keyword: string; error: string }>
  >([]);
  const [committed, setCommitted] = useState<
    Array<{ keyword: string; title: string; notionUrl: string }>
  >([]);
  const [editing, setEditing] = useState<EditableRow | null>(null);
  const [viewing, setViewing] = useState<EditableRow | null>(null);

  const totalKeywordsCount = useMemo(
    () =>
      cards.reduce(
        (acc, c) => acc + c.keywords.filter((k) => k.trim().length > 0).length,
        0,
      ),
    [cards],
  );

  const buildBatchRequest = () => ({
    monthlyDbId,
    hospitals: cards
      .filter((c) => c.hospitalPageId)
      .map((c) => ({
        hospitalPageId: c.hospitalPageId,
        keywords: c.keywords.map((k) => k.trim()).filter(Boolean),
        emphasis: c.emphasis.trim() || undefined,
      }))
      .filter((c) => c.keywords.length > 0),
  });

  const handlePreview = async () => {
    const req = buildBatchRequest();
    if (req.hospitals.length === 0) {
      message.warning("병원과 키워드를 1개 이상 입력해주세요.");
      return;
    }
    setBusy(true);
    setEditableRows([]);
    setErrors([]);
    setCommitted([]);
    try {
      const res = await postingApi.previewRows(req);
      setEditableRows(res.rows.map(rowResultToEditable));
      setErrors(res.errors);
      message.success(
        `미리보기 ${res.rows.length}건 생성 완료${res.errors.length ? ` (오류 ${res.errors.length}건)` : ""}`,
      );
    } catch (e: any) {
      message.error(`미리보기 실패: ${e?.message || "오류"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = () => {
    if (editableRows.length === 0) {
      message.warning("미리보기 결과가 없습니다. 먼저 '미리보기'를 실행해주세요.");
      return;
    }
    Modal.confirm({
      title: `${editableRows.length}건의 row를 매월 DB에 적재합니다.`,
      content: "확정 후 Notion에 row가 생성됩니다. 진행할까요?",
      okText: "적재",
      cancelText: "취소",
      onOk: async () => {
        setBusy(true);
        setCommitted([]);
        try {
          const items: CommitPreviewItem[] = editableRows.map((r) => ({
            hospitalPageId: r.hospitalPageId,
            hospitalSelectName: r.hospitalSelectName || undefined,
            keyword: r.keyword,
            title: r.title,
            additionalNote: r.additionalNote,
            pageBodyMarkdown: r.pageBodyMarkdown,
          }));
          const res = await postingApi.commitPreview(items, monthlyDbId);
          setCommitted(
            res.created.map((c) => ({
              keyword: c.keyword,
              title: c.title,
              notionUrl: c.notionUrl,
            })),
          );
          if (res.errors.length) {
            message.warning(
              `적재 완료 ${res.created.length}건 / 오류 ${res.errors.length}건`,
            );
          } else {
            message.success(`적재 완료: ${res.created.length}건`);
          }
        } catch (e: any) {
          message.error(`적재 실패: ${e?.message || "오류"}`);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleDeleteRow = (rowId: string) => {
    setEditableRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const handleSaveEdit = (updated: EditableRow) => {
    setEditableRows((prev) =>
      prev.map((r) => (r.rowId === updated.rowId ? updated : r)),
    );
    setEditing(null);
    message.success("수정 적용됨");
  };

  return (
    <div>
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <Text strong>대상 매월 DB</Text>
            <Select
              style={{ width: 200 }}
              value={monthlyDbId}
              onChange={(v) => setMonthlyDbId(v)}
              options={monthlyDbs.map((db) => ({
                value: db.databaseId,
                label: db.title,
              }))}
            />
          </Space>
        }
      >
        <Text type="secondary">기본은 가장 최근 매월 DB. 필요 시 다른 월 선택.</Text>
      </Card>

      {cards.map((card, i) => (
        <Card
          key={card.id}
          size="small"
          style={{ marginBottom: 12 }}
          title={`병원 ${i + 1}`}
          extra={
            cards.length > 1 ? (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  setCards((prev) => prev.filter((c) => c.id !== card.id))
                }
              />
            ) : null
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select
              showSearch
              placeholder="병원 선택"
              style={{ width: "100%" }}
              value={card.hospitalPageId || undefined}
              onChange={(v) => {
                const h = hospitals.find((hh) => hh.id === v);
                setCards((prev) =>
                  prev.map((c) =>
                    c.id === card.id
                      ? { ...c, hospitalPageId: v, hospitalName: h?.name || "" }
                      : c,
                  ),
                );
              }}
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={hospitals.map((h) => ({
                value: h.id,
                label: `${h.name}${h.director ? ` (${h.director})` : ""}${h.serviceLines?.length ? ` — ${h.serviceLines.slice(0, 3).join(", ")}` : ""}`,
              }))}
            />

            <div>
              <Text strong>키워드 (각 키워드당 1개 row 생성)</Text>
              <Space direction="vertical" style={{ width: "100%", marginTop: 6 }}>
                {card.keywords.map((kw, ki) => (
                  <Space key={ki} style={{ width: "100%" }}>
                    <Input
                      placeholder='예: "성남내과"'
                      value={kw}
                      style={{ width: 380 }}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCards((prev) =>
                          prev.map((c) =>
                            c.id === card.id
                              ? {
                                  ...c,
                                  keywords: c.keywords.map((k, idx) =>
                                    idx === ki ? v : k,
                                  ),
                                }
                              : c,
                          ),
                        );
                      }}
                    />
                    {card.keywords.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          setCards((prev) =>
                            prev.map((c) =>
                              c.id === card.id
                                ? {
                                    ...c,
                                    keywords: c.keywords.filter(
                                      (_, idx) => idx !== ki,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                      />
                    )}
                  </Space>
                ))}
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    setCards((prev) =>
                      prev.map((c) =>
                        c.id === card.id
                          ? { ...c, keywords: [...c.keywords, ""] }
                          : c,
                      ),
                    )
                  }
                >
                  키워드 추가
                </Button>
              </Space>
            </div>

            <div>
              <Text strong>이번 달 강조사항 (선택)</Text>
              <TextArea
                placeholder='예: "허리통증 비중 ↑" / "신규 장비 OO 도입 반영"'
                value={card.emphasis}
                rows={2}
                style={{ marginTop: 6 }}
                onChange={(e) =>
                  setCards((prev) =>
                    prev.map((c) =>
                      c.id === card.id ? { ...c, emphasis: e.target.value } : c,
                    ),
                  )
                }
              />
            </div>
          </Space>
        </Card>
      ))}

      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            setCards((prev) => [
              ...prev,
              {
                id: uid(),
                hospitalPageId: "",
                hospitalName: "",
                keywords: [""],
                emphasis: "",
              },
            ])
          }
        >
          병원 추가
        </Button>
        <Button onClick={handlePreview} loading={busy} type="default">
          미리보기 ({totalKeywordsCount}건)
        </Button>
        <Button
          onClick={handleCommit}
          loading={busy}
          type="primary"
          disabled={editableRows.length === 0}
        >
          매월 DB에 적재 ({editableRows.length}건)
        </Button>
        {editableRows.length > 0 && (
          <Text type="secondary">
            ※ 미리보기 결과를 수정/삭제 후 적재하면 그대로 Notion에 들어갑니다 (LLM 재호출 X)
          </Text>
        )}
      </Space>

      {(editableRows.length > 0 || errors.length > 0) && (
        <PreviewListPanel
          rows={editableRows}
          errors={errors}
          committed={committed}
          onView={setViewing}
          onEdit={setEditing}
          onDelete={handleDeleteRow}
        />
      )}

      <RowEditModal
        row={editing}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
      <RowViewModal row={viewing} onCancel={() => setViewing(null)} />
    </div>
  );
}

// =============================================================================
// 미리보기 리스트 패널
// =============================================================================

function PreviewListPanel({
  rows,
  errors,
  committed,
  onView,
  onEdit,
  onDelete,
}: {
  rows: EditableRow[];
  errors: Array<{ hospitalPageId: string; keyword: string; error: string }>;
  committed: Array<{ keyword: string; title: string; notionUrl: string }>;
  onView: (r: EditableRow) => void;
  onEdit: (r: EditableRow) => void;
  onDelete: (rowId: string) => void;
}) {
  return (
    <Card title="미리보기 결과" style={{ marginTop: 16 }}>
      <Table<EditableRow>
        size="small"
        rowKey={(r) => r.rowId}
        dataSource={rows}
        pagination={{ pageSize: 30 }}
        columns={[
          { title: "병원", dataIndex: "hospitalName", width: 140 },
          { title: "키워드", dataIndex: "keyword", width: 160 },
          { title: "주제", dataIndex: "title" },
          {
            title: "매칭 시술",
            width: 200,
            render: (_, r) => (
              <>
                {r.matchedTreatments.slice(0, 2).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </>
            ),
          },
          {
            title: "경고",
            width: 70,
            render: (_, r) =>
              r.warnings.length ? (
                <Tag color="orange">{r.warnings.length}</Tag>
              ) : null,
          },
          {
            title: "Notion",
            width: 90,
            render: (_, r) => {
              const c = committed.find(
                (cc) => cc.keyword === r.keyword && cc.title === r.title,
              );
              return c ? (
                <a href={c.notionUrl} target="_blank" rel="noreferrer">
                  열기
                </a>
              ) : (
                <Tag>대기</Tag>
              );
            },
          },
          {
            title: "작업",
            width: 160,
            render: (_, r) => (
              <Space>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onView(r)}
                />
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(r)}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(r.rowId)}
                />
              </Space>
            ),
          },
        ]}
      />
      {errors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong type="danger">
            오류 {errors.length}건
          </Text>
          <Table
            size="small"
            rowKey={(r: any) => `${r.hospitalPageId}-${r.keyword}`}
            dataSource={errors}
            pagination={false}
            columns={[
              { title: "병원ID", dataIndex: "hospitalPageId", width: 200 },
              { title: "키워드", dataIndex: "keyword", width: 180 },
              { title: "오류", dataIndex: "error" },
            ]}
          />
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// 미리보기 row 보기 모달 (read-only)
// =============================================================================

function RowViewModal({
  row,
  onCancel,
}: {
  row: EditableRow | null;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={row?.title}
      open={!!row}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      {row && (
        <>
          <Paragraph>
            <Text strong>병원:</Text> {row.hospitalName} / <Text strong>키워드:</Text>{" "}
            {row.keyword}
          </Paragraph>
          <Paragraph>
            <Text strong>매칭 시술:</Text>{" "}
            {row.matchedTreatments.join(", ") || "(없음)"}
          </Paragraph>
          <Paragraph>
            <Text strong>매칭 페르소나:</Text>{" "}
            {row.matchedPersonas.join(", ") || "(없음)"}
          </Paragraph>
          <Paragraph>
            <Text strong>매칭 비유:</Text>{" "}
            {row.matchedMetaphors.join(", ") || "(없음)"}
          </Paragraph>
          <Paragraph>
            <Text strong>차별화:</Text>{" "}
            {row.matchedDifferentiators.join(", ") || "(없음)"}
          </Paragraph>
          <Paragraph>
            <Text strong>매칭 근거:</Text> {row.matchingNote}
          </Paragraph>
          {row.warnings.length > 0 && (
            <Paragraph type="warning">
              <Text strong>경고:</Text>
              <ul>
                {row.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Paragraph>
          )}
          <Title level={5}>페이지 본문 기획안</Title>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 4,
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              maxHeight: 500,
              overflow: "auto",
            }}
          >
            {row.pageBodyMarkdown}
          </pre>
        </>
      )}
    </Modal>
  );
}

// =============================================================================
// 미리보기 row 수정 모달 (editable)
// =============================================================================

function RowEditModal({
  row,
  onCancel,
  onSave,
}: {
  row: EditableRow | null;
  onCancel: () => void;
  onSave: (updated: EditableRow) => void;
}) {
  const [title, setTitle] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  const [pageBody, setPageBody] = useState("");

  useEffect(() => {
    if (row) {
      setTitle(row.title);
      setAdditionalNote(row.additionalNote);
      setPageBody(row.pageBodyMarkdown);
    }
  }, [row]);

  if (!row) return null;

  return (
    <Modal
      title={`수정: ${row.hospitalName} / ${row.keyword}`}
      open={!!row}
      onCancel={onCancel}
      width={1000}
      okText="적용"
      cancelText="취소"
      onOk={() =>
        onSave({
          ...row,
          title: title.trim(),
          additionalNote: additionalNote.trim(),
          pageBodyMarkdown: pageBody,
        })
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Text strong>글 주제</Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <Text strong>추가 전달 사항</Text>
          <TextArea
            rows={2}
            value={additionalNote}
            onChange={(e) => setAdditionalNote(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <Text strong>페이지 본문 마크다운 (디렉션 + 5블록 템플릿)</Text>
          <TextArea
            rows={20}
            value={pageBody}
            onChange={(e) => setPageBody(e.target.value)}
            style={{
              marginTop: 4,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
            }}
          />
        </div>
      </Space>
    </Modal>
  );
}

// =============================================================================
// 병원 정보 업데이트 탭
// =============================================================================

function UpdateTab({ hospitals }: { hospitals: HospitalSummary[] }) {
  const [hospitalPageId, setHospitalPageId] = useState<string | undefined>();
  const [changeNote, setChangeNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<UpdatePreview | null>(null);

  const handlePreview = async () => {
    if (!hospitalPageId) {
      message.warning("병원을 선택해주세요");
      return;
    }
    if (!changeNote.trim() && files.length === 0) {
      message.warning("자연어 변동사항 또는 추가 인터뷰 PDF 중 하나는 필요합니다");
      return;
    }
    setBusy(true);
    setPreview(null);
    try {
      const res = await postingApi.previewHospitalUpdate(
        hospitalPageId,
        changeNote.trim() || undefined,
        files.length ? files : undefined,
      );
      setPreview(res);
      message.success(`변경 ${res.changes.length}건 추출`);
    } catch (e: any) {
      message.error(`미리보기 실패: ${e?.message || "오류"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = () => {
    if (!preview) return;
    Modal.confirm({
      title: "Notion 적용 확정",
      content: `${preview.hospitalName}의 변경사항 ${preview.changes.length}건을 Notion에 반영합니다.`,
      okText: "적용",
      cancelText: "취소",
      onOk: async () => {
        setBusy(true);
        try {
          await postingApi.commitHospitalUpdate(
            preview.hospitalPageId,
            preview.afterMarkdown,
          );
          message.success("적용 완료");
          setPreview(null);
          setChangeNote("");
          setFiles([]);
        } catch (e: any) {
          message.error(`적용 실패: ${e?.message || "오류"}`);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <div>
      <Card title="기존 병원 정보 업데이트" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>병원 선택</Text>
            <Select
              showSearch
              placeholder="업데이트할 기존 병원 선택"
              style={{ width: "100%", marginTop: 4 }}
              value={hospitalPageId}
              onChange={(v) => setHospitalPageId(v)}
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={hospitals.map((h) => ({
                value: h.id,
                label: h.name,
              }))}
            />
          </div>
          <div>
            <Text strong>변동사항 (자연어, 선택)</Text>
            <TextArea
              rows={5}
              placeholder='예: "6월부터 365일 진료. 기존 일요일 휴진 → 일요일 진료. 정형외과 전문의 김OO 합류로 정형/내과 모두 진료."'
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>추가 인터뷰 PDF (선택, 여러 개 가능)</Text>
            <Upload
              multiple
              beforeUpload={(f) => {
                setFiles((prev) => [...prev, f]);
                return false;
              }}
              onRemove={(f) =>
                setFiles((prev) => prev.filter((x) => x.name !== f.name))
              }
              fileList={files.map((f) => ({
                uid: f.name,
                name: f.name,
                status: "done" as const,
              }))}
              accept=".pdf"
              style={{ marginTop: 4 }}
            >
              <Button icon={<UploadOutlined />} style={{ marginTop: 4 }}>
                추가 인터뷰 PDF 선택
              </Button>
            </Upload>
          </div>
          <Text type="secondary">
            ※ 자연어 또는 PDF 중 하나는 필수. 둘 다 같이 사용 가능 (예: "이번에 추가 인터뷰 진행함" + PDF).
          </Text>
          <Button type="primary" onClick={handlePreview} loading={busy}>
            변경 미리보기
          </Button>
        </Space>
      </Card>

      {preview && (
        <Card title={`${preview.hospitalName} — 변경사항 ${preview.changes.length}건`}>
          <Table
            size="small"
            dataSource={preview.changes}
            pagination={false}
            rowKey={(c, i) => `${c.field}-${i}`}
            columns={[
              { title: "필드", dataIndex: "field", width: 200 },
              { title: "변경 전", dataIndex: "before" },
              { title: "변경 후", dataIndex: "after" },
              { title: "요약", dataIndex: "summary" },
            ]}
          />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleCommit} loading={busy}>
              Notion에 적용
            </Button>
            <Button onClick={() => setPreview(null)}>취소</Button>
          </Space>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// 신규 인터뷰 추출 탭
// =============================================================================

function ImportTab({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<StructuredImportData | null>(null);
  const [committedResult, setCommittedResult] =
    useState<CommitImportResult | null>(null);

  const handlePreview = async () => {
    if (files.length === 0 && !text.trim()) {
      message.warning("PDF 또는 텍스트 입력 필요");
      return;
    }
    setBusy(true);
    setData(null);
    setCommittedResult(null);
    try {
      const res = await postingApi.previewImport(
        files.length ? files : undefined,
        text.trim() || undefined,
      );
      setData(res);
      message.success(
        `추출 완료: 시술 ${res.treatments.length} / 차별화 ${res.differentiators.length} / 비유 ${res.metaphors.length} / 페르소나 ${res.personas.length}`,
      );
    } catch (e: any) {
      message.error(`추출 실패: ${e?.message || "오류"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = () => {
    if (!data) return;
    Modal.confirm({
      title: `${data.profile.hospitalName} — Notion 6 DB 적재`,
      content: `1번 마스터 1건 + 시술 ${data.treatments.length} + 차별화 ${data.differentiators.length} + 비유 ${data.metaphors.length} + 페르소나 ${data.personas.length}`,
      okText: "적재",
      cancelText: "취소",
      onOk: async () => {
        setBusy(true);
        try {
          const res = await postingApi.commitImport(data);
          setCommittedResult(res);
          message.success(
            `적재 완료: 시술 ${res.treatments} / 차별화 ${res.differentiators} / 비유 ${res.metaphors} / 페르소나 ${res.personas}${res.errors.length ? ` (오류 ${res.errors.length})` : ""}`,
          );
          onDone();
        } catch (e: any) {
          message.error(`적재 실패: ${e?.message || "오류"}`);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // 정형 데이터 row별 편집 (간단: title만 수정/삭제)
  const removeArrayItem = <K extends keyof StructuredImportData>(
    key: K,
    idx: number,
  ) => {
    if (!data) return;
    const arr = (data[key] as any[]).filter((_, i) => i !== idx);
    setData({ ...data, [key]: arr } as StructuredImportData);
  };

  return (
    <div>
      <Card title="신규 병원 인터뷰 입력 (PDF 여러 개 동시 가능)" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Upload
            multiple
            beforeUpload={(f) => {
              setFiles((prev) => [...prev, f]);
              return false;
            }}
            onRemove={(f) =>
              setFiles((prev) => prev.filter((x) => x.name !== f.name))
            }
            fileList={files.map((f) => ({
              uid: f.name,
              name: f.name,
              status: "done" as const,
            }))}
            accept=".pdf"
          >
            <Button icon={<UploadOutlined />}>PDF 추가 (여러 개 가능)</Button>
          </Upload>
          <TextArea
            rows={8}
            placeholder="또는 인터뷰 본문을 직접 붙여넣기 (PDF와 동시 사용 OK)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Space>
            <Button type="primary" onClick={handlePreview} loading={busy}>
              미리보기 추출
            </Button>
            <Button
              type="primary"
              ghost
              onClick={handleCommit}
              loading={busy}
              disabled={!data}
            >
              Notion 6 DB에 적재
            </Button>
          </Space>
        </Space>
      </Card>

      {data && (
        <>
          <Card title={`병원: ${data.profile.hospitalName}`} style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input
                addonBefore="원장"
                value={data.profile.director}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, director: e.target.value },
                  })
                }
              />
              <Input
                addonBefore="전문의 자격"
                value={data.profile.specialistLicense}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, specialistLicense: e.target.value },
                  })
                }
              />
              <Input
                addonBefore="위치 단서"
                value={data.profile.locationHint}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, locationHint: e.target.value },
                  })
                }
              />
              <Input
                addonBefore="홈페이지"
                value={data.profile.homepageUrl}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, homepageUrl: e.target.value },
                  })
                }
              />
              <Input
                addonBefore="네이버 플레이스"
                value={data.profile.naverPlaceUrl}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, naverPlaceUrl: e.target.value },
                  })
                }
              />
              <div>
                <Text strong>마케팅 룰 (절대 가드)</Text>
                <TextArea
                  rows={4}
                  value={data.profile.marketingRule}
                  onChange={(e) =>
                    setData({
                      ...data,
                      profile: { ...data.profile, marketingRule: e.target.value },
                    })
                  }
                  style={{ marginTop: 4 }}
                />
              </div>
            </Space>
          </Card>

          <Card title={`시술·증상 ${data.treatments.length}건`} style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey={(_, i) => `t-${i}`}
              dataSource={data.treatments}
              pagination={false}
              columns={[
                { title: "시술명", dataIndex: "name", width: 200 },
                {
                  title: "카테고리",
                  width: 200,
                  render: (_, r: any) => (
                    <>
                      {(r.category || []).map((c: string) => (
                        <Tag key={c}>{c}</Tag>
                      ))}
                    </>
                  ),
                },
                { title: "적응증", dataIndex: "indication" },
                {
                  title: "시그",
                  width: 60,
                  render: (_, r: any) =>
                    r.isSignature ? <Tag color="gold">⭐</Tag> : null,
                },
                {
                  title: "",
                  width: 50,
                  render: (_, _r, i) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeArrayItem("treatments", i)}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Card title={`차별화 ${data.differentiators.length}건`} style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey={(_, i) => `d-${i}`}
              dataSource={data.differentiators}
              pagination={false}
              columns={[
                { title: "포인트", dataIndex: "point" },
                { title: "다른 병원", dataIndex: "otherHospital" },
                { title: "우리", dataIndex: "ourHospital" },
                { title: "강도", dataIndex: "strength", width: 80 },
                {
                  title: "",
                  width: 50,
                  render: (_, _r, i) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeArrayItem("differentiators", i)}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Card title={`비유 ${data.metaphors.length}건`} style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey={(_, i) => `m-${i}`}
              dataSource={data.metaphors}
              pagination={false}
              columns={[
                { title: "비유", dataIndex: "metaphor" },
                { title: "설명", dataIndex: "shortDescription" },
                { title: "적용", dataIndex: "applyTo" },
                {
                  title: "",
                  width: 50,
                  render: (_, _r, i) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeArrayItem("metaphors", i)}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Card title={`페르소나 ${data.personas.length}건`}>
            <Table
              size="small"
              rowKey={(_, i) => `p-${i}`}
              dataSource={data.personas}
              pagination={false}
              columns={[
                { title: "페르소나", dataIndex: "persona" },
                {
                  title: "연령대",
                  width: 200,
                  render: (_, r: any) => (
                    <>
                      {(r.ageRanges || []).map((a: string) => (
                        <Tag key={a}>{a}</Tag>
                      ))}
                    </>
                  ),
                },
                { title: "고민", dataIndex: "concern" },
                {
                  title: "",
                  width: 50,
                  render: (_, _r, i) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeArrayItem("personas", i)}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}

      {committedResult && (
        <Card title="✅ 적재 완료" style={{ marginTop: 16 }}>
          <Paragraph>
            <Text strong>병원 마스터:</Text>{" "}
            <a href={committedResult.hospitalPageUrl} target="_blank" rel="noreferrer">
              Notion에서 열기
            </a>
          </Paragraph>
          <Paragraph>
            시술 {committedResult.treatments} / 차별화 {committedResult.differentiators} / 비유{" "}
            {committedResult.metaphors} / 페르소나 {committedResult.personas}
          </Paragraph>
          {committedResult.errors.length > 0 && (
            <Paragraph type="warning">
              <Text strong>오류 {committedResult.errors.length}건:</Text>
              <ul>
                {committedResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Paragraph>
          )}
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// 메인 페이지
// =============================================================================

export default function PostingManagerPage() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<HospitalSummary[]>([]);
  const [monthlyDbs, setMonthlyDbs] = useState<MonthlyDb[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await postingApi.getHospitals();
      setHospitals(res.hospitals);
      setMonthlyDbs(res.monthlyDbs);
    } catch (e: any) {
      message.error(`데이터 로드 실패: ${e?.message || "오류"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => navigate("/admin/dashboard")}>← 대시보드</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          새로고침
        </Button>
      </Space>

      <Title level={3}>📝 포스팅 매니저</Title>
      <Paragraph type="secondary">
        병원·키워드를 입력하면 미리보기 → 수정/삭제 → Notion 매월 포스팅 관리 DB에 적재됩니다.
        병원 정보 변동사항도 자연어로 적어 미리보기 후 반영할 수 있습니다.
      </Paragraph>

      {loading ? (
        <Spin />
      ) : (
        <Tabs
          items={[
            {
              key: "generate",
              label: "글 주제·기획안 생성",
              children: (
                <GenerateTab hospitals={hospitals} monthlyDbs={monthlyDbs} />
              ),
            },
            {
              key: "update",
              label: "기존 병원 정보 업데이트",
              children: <UpdateTab hospitals={hospitals} />,
            },
            {
              key: "import",
              label: "신규 병원 인터뷰 적재",
              children: <ImportTab onDone={fetchData} />,
            },
          ]}
        />
      )}
    </div>
  );
}
