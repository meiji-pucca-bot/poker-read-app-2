import StreetEntry from "@/components/StreetEntry";

export default function TurnPage() {
  return (
    <StreetEntry
      streetName="turn"
      japaneseTitle="ターン"
      stepText="STEP 6 / ターン"
      cardCount={1}
      previousHref="/flop"
      nextHref="/river"
      previousBoardKeys={["poker-read-flop"]}
    />
  );
}