import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ childId: string }>;
};

export default async function LegacyChildTimelineRedirect({ params }: Props) {
  const { childId } = await params;
  redirect(`/portfolios/${childId}`);
}
