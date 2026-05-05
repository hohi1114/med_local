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
} from "../utils/postingApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// =============================================================================
// 타입 (로컬 form state)
// =============================================================================

interface HospitalFormCard {
  id: string; // local card id (uuid)
  hospitalPageId: string;
  hospitalName: string;
  keywords: string[];
  emphasis: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
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
  const [previewResult, setPreviewResult] = useState<RowResult[] | null>(null);
  const [errors, setErrors] = useState<
    Array<{ hospitalPageId: string; keyword: string; error: string }>
  >([]);

  const totalRowsCount = useMemo(
    () =>
      cards.reduce(
        (acc, c) =>
          acc +
          c.keywords.filter((k) => k.trim().length > 0).length,
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
    setPreviewResult(null);
    setErrors([]);
    try {
      const res = await postingApi.previewRows(req);
      setPreviewResult(res.rows);
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

  const handleCommit = async () => {
    const req = buildBatchRequest();
    if (req.hospitals.length === 0) return;
    Modal.confirm({
      title: `${totalRowsCount}건의 row를 매월 DB에 적재합니다.`,
      content: "확정 후에는 Notion에 row가 생성됩니다. 진행할까요?",
      okText: "적재",
      cancelText: "취소",
      onOk: async () => {
        setBusy(true);
        try {
          const res = await postingApi.generateRows(req);
          setPreviewResult(res.rows);
          setErrors(res.errors);
          message.success(
            `적재 완료: ${res.rows.length}건${res.errors.length ? ` (오류 ${res.errors.length}건)` : ""}`,
          );
        } catch (e: any) {
          message.error(`적재 실패: ${e?.message || "오류"}`);
        } finally {
          setBusy(false);
        }
      },
    });
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
        <Text type="secondary">
          기본은 가장 최근 매월 DB. 필요 시 다른 월 선택.
        </Text>
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
          미리보기 ({totalRowsCount}건)
        </Button>
        <Button
          onClick={handleCommit}
          loading={busy}
          type="primary"
          disabled={totalRowsCount === 0}
        >
          매월 DB에 적재 ({totalRowsCount}건)
        </Button>
      </Space>

      {(previewResult || errors.length > 0) && (
        <ResultPanel rows={previewResult || []} errors={errors} />
      )}
    </div>
  );
}

function ResultPanel({
  rows,
  errors,
}: {
  rows: RowResult[];
  errors: Array<{ hospitalPageId: string; keyword: string; error: string }>;
}) {
  const [open, setOpen] = useState<RowResult | null>(null);

  return (
    <Card title="결과" style={{ marginTop: 16 }}>
      <Table<RowResult>
        size="small"
        rowKey={(r) => `${r.hospitalName}-${r.keyword}`}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "병원", dataIndex: "hospitalName", width: 160 },
          { title: "키워드", dataIndex: "keyword", width: 180 },
          {
            title: "주제",
            render: (_, r) => r.preview.title,
          },
          {
            title: "매칭 시술",
            width: 200,
            render: (_, r) => (
              <>
                {r.preview.matchedTreatments.slice(0, 2).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </>
            ),
          },
          {
            title: "경고",
            width: 100,
            render: (_, r) =>
              r.warnings.length ? <Tag color="orange">{r.warnings.length}</Tag> : null,
          },
          {
            title: "Notion",
            width: 120,
            render: (_, r) =>
              r.created ? (
                <a href={r.created.url} target="_blank" rel="noreferrer">
                  열기
                </a>
              ) : (
                <Tag>미리보기</Tag>
              ),
          },
          {
            title: "상세",
            width: 80,
            render: (_, r) => (
              <Button size="small" onClick={() => setOpen(r)}>
                보기
              </Button>
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

      <Modal
        title={open?.preview.title}
        open={!!open}
        onCancel={() => setOpen(null)}
        footer={null}
        width={900}
      >
        {open && (
          <>
            <Paragraph>
              <Text strong>매칭 시술:</Text>{" "}
              {open.preview.matchedTreatments.join(", ") || "(없음)"}
            </Paragraph>
            <Paragraph>
              <Text strong>매칭 페르소나:</Text>{" "}
              {open.preview.matchedPersonas.join(", ") || "(없음)"}
            </Paragraph>
            <Paragraph>
              <Text strong>매칭 비유:</Text>{" "}
              {open.preview.matchedMetaphors.join(", ") || "(없음)"}
            </Paragraph>
            <Paragraph>
              <Text strong>차별화:</Text>{" "}
              {open.preview.matchedDifferentiators.join(", ") || "(없음)"}
            </Paragraph>
            <Paragraph>
              <Text strong>매칭 근거:</Text> {open.preview.matchingNote}
            </Paragraph>
            {open.warnings.length > 0 && (
              <Paragraph type="warning">
                <Text strong>경고:</Text>
                <ul>
                  {open.warnings.map((w, i) => (
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
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                maxHeight: 500,
                overflow: "auto",
              }}
            >
              {open.preview.pageBodyMarkdown}
            </pre>
          </>
        )}
      </Modal>
    </Card>
  );
}

// =============================================================================
// 병원 정보 업데이트 탭
// =============================================================================

function UpdateTab({ hospitals }: { hospitals: HospitalSummary[] }) {
  const [hospitalPageId, setHospitalPageId] = useState<string | undefined>();
  const [changeNote, setChangeNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<UpdatePreview | null>(null);

  const handlePreview = async () => {
    if (!hospitalPageId || !changeNote.trim()) {
      message.warning("병원 선택 + 변동사항 입력 필요");
      return;
    }
    setBusy(true);
    setPreview(null);
    try {
      const res = await postingApi.previewHospitalUpdate(
        hospitalPageId,
        changeNote.trim(),
      );
      setPreview(res);
      message.success(`변경 ${res.changes.length}건 추출`);
    } catch (e: any) {
      message.error(`미리보기 실패: ${e?.message || "오류"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
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
      <Card title="변동사항 입력" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select
            showSearch
            placeholder="병원 선택"
            style={{ width: "100%" }}
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
          <TextArea
            rows={6}
            placeholder='예: "6월부터 365일 진료로 운영 방식 변경. 기존 일요일 휴진 → 일요일 진료. 정형외과 전문의 김OO 합류로 정형/내과 모두 진료."'
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
          />
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
        병원·키워드를 입력하면 Notion 매월 포스팅 관리 DB에 주제·기획안이 자동 생성됩니다.
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
              label: "병원 정보 업데이트",
              children: <UpdateTab hospitals={hospitals} />,
            },
            {
              key: "import",
              label: "신규 인터뷰 적재 (검수용)",
              children: <ImportTab onDone={fetchData} />,
            },
          ]}
        />
      )}
    </div>
  );
}

function ImportTab({ onDone: _onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [markdown, setMarkdown] = useState("");

  const handleExtract = async () => {
    if (!file && !text.trim()) {
      message.warning("PDF 또는 텍스트 입력 필요");
      return;
    }
    setBusy(true);
    setMarkdown("");
    try {
      const res = await postingApi.importInterview(
        file || undefined,
        text.trim() || undefined,
      );
      setMarkdown(res.markdown);
      message.success("추출 완료. 검수 후 운영팀이 1번 마스터 DB에 직접 적재.");
    } catch (e: any) {
      message.error(`추출 실패: ${e?.message || "오류"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Card title="인터뷰 입력" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            accept=".pdf"
          >
            <Button icon={<UploadOutlined />}>PDF 선택</Button>
          </Upload>
          {file && <Text>선택됨: {file.name}</Text>}
          <TextArea
            rows={8}
            placeholder="또는 인터뷰 본문을 직접 붙여넣기"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="primary" onClick={handleExtract} loading={busy}>
            마케팅 프로필 추출
          </Button>
        </Space>
      </Card>

      {markdown && (
        <Card title="추출 결과 (검수용)">
          <Paragraph type="secondary">
            검수 후 운영팀이 Notion 1번 마스터 DB에 row를 직접 만들고 페이지 본문에
            붙여넣기 하세요. (자동 적재는 후속 단계에서 추가)
          </Paragraph>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 4,
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              maxHeight: 600,
              overflow: "auto",
            }}
          >
            {markdown}
          </pre>
          <Button
            style={{ marginTop: 8 }}
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              message.success("클립보드에 복사");
            }}
          >
            마크다운 복사
          </Button>
        </Card>
      )}
    </div>
  );
}
