import StreetEntry from "@/components/StreetEntry";

export default function RiverPage() {
  return (
    <StreetEntry
      streetName="river"
      japaneseTitle="リバー"
      stepText="STEP 7 / リバー"
      cardCount={1}
      previousHref="/turn"
      nextHref="/result"
      previousBoardKeys={[
        "poker-read-flop",
        "poker-read-turn",
      ]}
    />
  );
}