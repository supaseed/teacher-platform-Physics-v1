import { useState } from "react";
import { Button, Group, Modal, Stack, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useReportQuestion } from "../api/hooks";

interface ReportModalProps {
  questionId: string;
  opened: boolean;
  onClose: () => void;
}

export function ReportModal({ questionId, opened, onClose }: ReportModalProps) {
  const [note, setNote] = useState("");
  const report = useReportQuestion();

  const handleSend = () => {
    report.mutate(
      { question_id: questionId, note: note.trim() },
      {
        onSuccess: () => {
          notifications.show({
            color: "green",
            message: "Thanks — the question has been reported.",
          });
          setNote("");
          onClose();
        },
        onError: (err) => {
          notifications.show({
            color: "red",
            title: "Could not send report",
            message: err.message,
          });
        },
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Report question" centered>
      <Stack>
        <Textarea
          label="What is wrong with this question?"
          placeholder="Describe the issue (wrong answer, typo, unclear wording…)"
          autosize
          minRows={4}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            loading={report.isPending}
            disabled={note.trim().length === 0}
          >
            Send report
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
