import StreetEntry from "@/components/StreetEntry";

export default function FlopPage() {
  return (
    <StreetEntry
  streetName="flop"
  japaneseTitle="フロップ"
  stepText="STEP 5 / フロップ"
  cardCount={3}
  previousHref="/preflop"
  nextHref="/turn"
/>
  );
}