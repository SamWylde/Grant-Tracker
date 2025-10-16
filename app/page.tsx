import Link from "next/link";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconClockHour4,
  IconDownload,
  IconUserCheck
} from "@tabler/icons-react";

import { GrantDiscovery } from "@/components/grant-discovery";
import { OrgSettingsForm } from "@/components/org-settings-form";
import { PipelineBoard } from "@/components/pipeline-board";
import { WaitlistForm } from "@/components/waitlist-form";

const features = [
  {
    title: "Discover opportunities",
    description:
      "Filter federal grants by program area, geography, and deadline. Save opportunities straight into your pipeline with a click.",
    icon: IconDownload
  },
  {
    title: "Collaborative pipeline",
    description:
      "Move grants across stages with clear owners, notes, and task checklists so everyone knows what is next.",
    icon: IconUserCheck
  },
  {
    title: "Multi-milestone reminders",
    description:
      "Automated email and SMS reminders keep LOIs, applications, and reports on track—no duplicate alerts required.",
    icon: IconClockHour4
  },
  {
    title: "Calendar integrations",
    description:
      "Sync an org-wide ICS feed or push deadlines into Google Calendar so every stakeholder stays aligned.",
    icon: IconCalendarEvent
  }
];

const steps = [
  {
    title: "Import your current spreadsheet",
    description: "Upload your CSV and we map deadlines and owners automatically.",
    number: "01"
  },
  {
    title: "Track grants with confidence",
    description: "Pipeline views, tasks, and reminders keep the team focused.",
    number: "02"
  },
  {
    title: "Celebrate more submissions",
    description: "Reporting shows wins per quarter and deadlines met across the org.",
    number: "03"
  }
];

export default function HomePage() {
  return (
    <Box component="div">
      <Box component="header" px="xl" py="md">
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Group gap="sm" align="center">
              <Paper radius="md" p="xs" withBorder shadow="md" bg="rgba(15,23,42,0.7)">
                <Text fw={600} size="lg">
                  GT
                </Text>
              </Paper>
              <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Grant Tracker
                </Text>
                <Text fw={600}>Never miss a funding deadline again</Text>
              </Stack>
            </Group>
            <Group gap="lg" visibleFrom="md" fw={500}>
              <Anchor component={Link} href="#features" c="dimmed">
                Features
              </Anchor>
              <Anchor component={Link} href="#steps" c="dimmed">
                How it works
              </Anchor>
              <Anchor component={Link} href="#workspace" c="dimmed">
                Product preview
              </Anchor>
              <Anchor component={Link} href="#faq" c="dimmed">
                FAQ
              </Anchor>
              <Anchor component={Link} href="/my-tasks" c="dimmed">
                My tasks
              </Anchor>
              <Anchor component={Link} href="/login" c="dimmed">
                Sign in
              </Anchor>
            </Group>
            <Group gap="sm">
              <Button component={Link} href="#waitlist" variant="outline" radius="xl">
                View demo
              </Button>
              <Button component={Link} href="#waitlist" radius="xl">
                Join waitlist
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box component="main">
        <Box component="section" py={{ base: "xl", sm: 80 }}>
          <Container size="xl">
            <Grid align="center" gutter={{ base: 32, md: 56 }}>
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <Stack gap="xl">
                  <Badge variant="light" color="teal" radius="xl" size="lg">
                    Accepting early access nonprofits
                  </Badge>
                  <Title order={1} size="h1">
                    Discover, track, and win more grants with one shared workspace.
                  </Title>
                  <Text size="lg" c="dimmed">
                    Grant Tracker helps small and rural nonprofits centralize every opportunity, deadline, and teammate update.
                    Stop hunting through spreadsheets and email threads.
                  </Text>
                  <Group gap="sm">
                    <Button component={Link} href="#waitlist" size="lg" radius="xl" variant="gradient" gradient={{ from: "midnight.5", to: "teal" }}>
                      Request onboarding call
                    </Button>
                    <Button component={Link} href="#learn-more" size="lg" radius="xl" variant="outline">
                      Watch 2-min overview
                    </Button>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Paper withBorder radius="lg" p="lg" bg="rgba(15,23,42,0.6)">
                      <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                        Multi-stage deadlines
                      </Text>
                      <Text mt="xs" fw={700} size="xl">
                        LOI → Application → Report
                      </Text>
                    </Paper>
                    <Paper withBorder radius="lg" p="lg" bg="rgba(15,23,42,0.6)">
                      <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                        Automated reminders
                      </Text>
                      <Text mt="xs" fw={700} size="xl">
                        T-30 / 14 / 7 / 3 / 1
                      </Text>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <Paper radius="xl" p="lg" withBorder shadow="xl" bg="rgba(8,17,40,0.8)">
                  <Group justify="space-between" align="center">
                    <Text fw={600}>Pipeline overview</Text>
                    <Text size="xs" c="dimmed">
                      This quarter
                    </Text>
                  </Group>
                  <Stack gap="md" mt="md">
                    <Card radius="lg" withBorder padding="md" bg="rgba(46, 160, 67, 0.12)" style={{ borderColor: "rgba(76, 201, 240, 0.2)" }}>
                      <Text size="xs" c="teal.2" tt="uppercase" fw={700}>
                        Researching
                      </Text>
                      <Text fw={600} mt={6}>
                        USDA Rural Business Development
                      </Text>
                      <Text size="xs" c="teal.1">
                        Draft due in 14 days
                      </Text>
                    </Card>
                    <Card radius="lg" withBorder padding="md" bg="rgba(56, 128, 246, 0.12)" style={{ borderColor: "rgba(56, 128, 246, 0.3)" }}>
                      <Text size="xs" c="blue.2" tt="uppercase" fw={700}>
                        Drafting
                      </Text>
                      <Text fw={600} mt={6}>
                        Community Facilities Grant
                      </Text>
                      <Text size="xs" c="blue.1">
                        Tasks: Budget review, letters of support
                      </Text>
                    </Card>
                    <Card radius="lg" withBorder padding="md" bg="rgba(142, 84, 233, 0.12)" style={{ borderColor: "rgba(142, 84, 233, 0.3)" }}>
                      <Text size="xs" c="grape.2" tt="uppercase" fw={700}>
                        Submitted
                      </Text>
                      <Text fw={600} mt={6}>
                        EDA Build to Scale
                      </Text>
                      <Text size="xs" c="grape.1">
                        Awaiting feedback
                      </Text>
                    </Card>
                  </Stack>
                  <Paper withBorder radius="lg" mt="lg" p="md" bg="rgba(15,23,42,0.65)">
                    <Text fw={600}>Next reminder</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      LOI due in 3 days · Email + SMS
                    </Text>
                  </Paper>
                </Paper>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        <Box id="features" component="section" py={80} bg="rgba(2,8,23,0.7)">
          <Container size="xl">
            <Stack gap="md" align="center" ta="center">
              <Title order={2}>Purpose-built for small and rural nonprofits</Title>
              <Text size="lg" c="dimmed" maw={720}>
                Grant Tracker centralizes grant discovery, collaboration, and reporting so your team can focus on winning funding.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" mt={48}>
              {features.map((feature) => (
                <Card key={feature.title} withBorder radius="xl" padding="xl" bg="rgba(15,23,42,0.65)">
                  <ThemeIcon size={40} radius="md" variant="light" color="midnight">
                    <feature.icon size="1.5rem" />
                  </ThemeIcon>
                  <Text fw={600} size="lg" mt="md">
                    {feature.title}
                  </Text>
                  <Text size="sm" c="dimmed" mt="sm">
                    {feature.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        <Box id="steps" component="section" py={80}>
          <Container size="xl">
            <Grid align="center" gutter={{ base: 32, md: 48 }}>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <Stack gap="md">
                  <Title order={2}>Launch in an afternoon</Title>
                  <Text size="lg" c="dimmed">
                    From data import to ICS calendar subscriptions, onboarding is guided end-to-end by our team so you are ready for the next funding cycle.
                  </Text>
                  <Paper withBorder radius="lg" p="md" bg="rgba(15,23,42,0.65)">
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Badge color="midnight" radius="sm" variant="light">
                          Pro
                        </Badge>
                        <Text size="sm">Google Calendar sync + SMS reminders</Text>
                      </Group>
                      <Group gap="xs">
                        <Badge color="teal" radius="sm" variant="light">
                          Core
                        </Badge>
                        <Text size="sm">Unlimited users per org & pipeline stages</Text>
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <Stack gap="lg">
                  {steps.map((step) => (
                    <Paper key={step.number} withBorder radius="xl" p="lg" bg="rgba(10,20,45,0.65)">
                      <Group align="flex-start" gap="lg">
                        <Badge radius="xl" size="lg" variant="light" color="midnight">
                          {step.number}
                        </Badge>
                        <Stack gap={4}>
                          <Text fw={600}>{step.title}</Text>
                          <Text size="sm" c="dimmed">
                            {step.description}
                          </Text>
                        </Stack>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        <Box id="workspace" component="section" py={80} bg="rgba(2,8,23,0.7)">
          <Container size="xl">
            <Stack gap="md" align="center" ta="center">
              <Title order={2}>See the live grant workspace</Title>
              <Text size="lg" c="dimmed" maw={720}>
                Configure org defaults, discover active opportunities, and move grants through the save & track workflow in real time.
              </Text>
            </Stack>
            <Stack gap="xl" mt={48}>
              <OrgSettingsForm />
              <GrantDiscovery />
              <PipelineBoard />
            </Stack>
          </Container>
        </Box>

        <Box id="waitlist" component="section" py={80}>
          <Container size="xl">
            <Grid align="center" gutter={{ base: 32, md: 48 }}>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <Stack gap="md">
                  <Title order={2}>Get a guided walkthrough</Title>
                  <Text size="lg" c="dimmed">
                    We are onboarding a limited number of small and rural nonprofits. Share a few details and we will set up an implementation call tailored to your grant pipeline.
                  </Text>
                  <List size="sm" c="dimmed" spacing="xs">
                    <List.Item>Import support for your existing spreadsheets</List.Item>
                    <List.Item>Deadline reminder configuration by LOI/Application/Report</List.Item>
                    <List.Item>Calendar integration set-up with ICS and Google Workspace</List.Item>
                  </List>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <WaitlistForm />
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        <Box id="faq" component="section" py={80} bg="rgba(2,8,23,0.7)">
          <Container size="xl">
            <Stack gap="md" align="center" ta="center">
              <Title order={2}>Built for real grant teams</Title>
              <Text size="lg" c="dimmed" maw={720}>
                We combine federal grant discovery with the collaboration features rural organizations asked for most.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt={48}>
              <Card withBorder radius="xl" padding="xl" bg="rgba(15,23,42,0.65)">
                <Text fw={600}>Where does the grant data come from?</Text>
                <Text size="sm" c="dimmed" mt="sm">
                  We integrate directly with Grants.gov and refresh opportunities every night. You can also add custom foundation grants manually.
                </Text>
              </Card>
              <Card withBorder radius="xl" padding="xl" bg="rgba(15,23,42,0.65)">
                <Text fw={600}>Can we keep our existing spreadsheets?</Text>
                <Text size="sm" c="dimmed" mt="sm">
                  Absolutely—import them via CSV to seed your pipeline. Grant Tracker keeps the data in sync going forward so you never start from scratch.
                </Text>
              </Card>
              <Card withBorder radius="xl" padding="xl" bg="rgba(15,23,42,0.65)">
                <Text fw={600}>How do reminders work?</Text>
                <Text size="sm" c="dimmed" mt="sm">
                  Add LOI, application, and report milestones for each grant and we send email (and SMS on the Pro plan) reminders at T-30/14/7/3/1 and day-of automatically.
                </Text>
              </Card>
              <Card withBorder radius="xl" padding="xl" bg="rgba(15,23,42,0.65)">
                <Text fw={600}>Do you support multiple organizations?</Text>
                <Text size="sm" c="dimmed" mt="sm">
                  Yes. Org data is isolated with row-level security. Each nonprofit can invite unlimited teammates with admin or contributor roles.
                </Text>
              </Card>
            </SimpleGrid>
          </Container>
        </Box>
      </Box>

      <Box component="footer" py={48} px="xl">
        <Container size="xl">
          <Group justify="space-between" align="center" gap="lg" direction={{ base: "column", md: "row" }}>
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} Grant Tracker. Built to help small nonprofits win more funding.
            </Text>
            <Group gap="lg">
              <Anchor component={Link} href="#privacy" c="dimmed">
                Privacy
              </Anchor>
              <Anchor component={Link} href="#security" c="dimmed">
                Security
              </Anchor>
              <Anchor component={Link} href="#contact" c="dimmed">
                Contact
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
