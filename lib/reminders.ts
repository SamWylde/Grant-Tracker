export type ReminderChannel = "email" | "sms";

export type ReminderScheduleEntry = {
  id: string;
  channel: ReminderChannel;
  offsetDays: number;
  sendAt: string;
  subject?: string;
  preview: string;
};

type BuildReminderScheduleArgs = {
  grantTitle: string;
  milestoneLabel: string;
  dueDate: string;
  channels: ReminderChannel[];
  offsets: number[];
  timezone: string;
  unsubscribeUrl: string;
};

type ReminderTemplate = {
  subject?: string;
  body: string;
};

const EMAIL_SUBJECT_TEMPLATE = (milestone: string, grant: string, offsetLabel: string) =>
  `${milestone} due ${offsetLabel} · ${grant}`;

const EMAIL_BODY_TEMPLATE = (
  grantTitle: string,
  milestoneLabel: string,
  dueDateLabel: string,
  offsetLabel: string,
  unsubscribeUrl: string
) => `Hi team,

${milestoneLabelText(milestoneLabel)} for ${grantTitle} is due ${offsetLabel}.

Due: ${dueDateLabel}

Prep checklist
• Confirm owner and collaborators
• Upload supporting documents
• Ensure budget + narratives align

Need more time? Snooze or reassign directly from your Grant Tracker workspace.

--
You are receiving this reminder because your organization opted into deadline alerts in Grant Tracker.
Unsubscribe: ${unsubscribeUrl}`;

const SMS_TEMPLATE = (
  grantTitle: string,
  milestoneLabel: string,
  dueDateLabel: string,
  offsetLabel: string,
  unsubscribeUrl: string
) =>
  `${milestoneLabel} for ${grantTitle} is due ${offsetLabel} (due ${dueDateLabel}). Reply STOP to opt out or visit ${unsubscribeUrl}`;

const DEFAULT_SEND_HOUR = 14; // 2 PM local time

function formatDateInTimezone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function milestoneLabelText(label: string) {
  return label;
}

function offsetLabel(offset: number) {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  return `in ${offset} days`;
}

function computeSendDate(dueDate: string, offset: number) {
  const due = new Date(`${dueDate}T${DEFAULT_SEND_HOUR.toString().padStart(2, "0")}:00:00`);
  const send = new Date(due.getTime() - offset * 24 * 60 * 60 * 1000);
  return send;
}

function renderTemplate(
  channel: ReminderChannel,
  args: Omit<BuildReminderScheduleArgs, "channels" | "offsets">,
  sendAt: Date,
  offset: number
): ReminderTemplate {
  const dueLabel = formatDateInTimezone(new Date(`${args.dueDate}T09:00:00`), args.timezone);
  const offsetText = offsetLabel(offset);
  if (channel === "email") {
    return {
      subject: EMAIL_SUBJECT_TEMPLATE(args.milestoneLabel, args.grantTitle, offsetText),
      body: EMAIL_BODY_TEMPLATE(
        args.grantTitle,
        args.milestoneLabel,
        dueLabel,
        offsetText,
        args.unsubscribeUrl
      )
    };
  }

  return {
    body: SMS_TEMPLATE(
      args.grantTitle,
      args.milestoneLabel,
      dueLabel,
      offsetText,
      args.unsubscribeUrl
    )
  };
}

export function buildReminderSchedule({
  grantTitle,
  milestoneLabel,
  dueDate,
  channels,
  offsets,
  timezone,
  unsubscribeUrl
}: BuildReminderScheduleArgs): ReminderScheduleEntry[] {
  const unique = new Map<string, ReminderScheduleEntry>();
  const safeOffsets = Array.from(new Set(offsets.filter((value) => value >= 0))).sort(
    (a, b) => a - b
  );

  for (const channel of channels) {
    for (const offset of safeOffsets) {
      const sendAt = computeSendDate(dueDate, offset);
      const template = renderTemplate(channel, {
        grantTitle,
        milestoneLabel,
        dueDate,
        timezone,
        unsubscribeUrl
      }, sendAt, offset);
      const id = `${channel}-${offset}`;
      unique.set(id, {
        id,
        channel,
        offsetDays: offset,
        sendAt: sendAt.toISOString(),
        subject: template.subject,
        preview: template.body.slice(0, 160)
      });
    }
  }

  return Array.from(unique.values()).sort((a, b) => {
    return new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime();
  });
}

export function formatReminderDate(sendAt: string, timezone: string) {
  try {
    return formatDateInTimezone(new Date(sendAt), timezone);
  } catch (error) {
    return sendAt;
  }
}

export function describeOffset(offset: number) {
  return offsetLabel(offset);
}
