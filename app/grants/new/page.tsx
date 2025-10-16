import { Container } from "@mantine/core";

import { ManualGrantForm } from "@/components/manual-grant-form";

export default function NewGrantPage() {
  return (
    <Container size="xl" py="xl">
      <ManualGrantForm />
    </Container>
  );
}
