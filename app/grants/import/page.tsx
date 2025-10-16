import { Container } from "@mantine/core";

import { CsvImporter } from "@/components/csv-importer";

export default function GrantImportPage() {
  return (
    <Container size="xl" py="xl">
      <CsvImporter />
    </Container>
  );
}
