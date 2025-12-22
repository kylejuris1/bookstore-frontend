import { useLocalSearchParams } from "expo-router"
import TagBooksScreen from "../../screens/TagBooksScreen"

export default function TagPage() {
  const { tagName } = useLocalSearchParams()
  const decodedTagName = typeof tagName === "string" ? decodeURIComponent(tagName) : tagName?.[0] ? decodeURIComponent(tagName[0]) : ""
  return <TagBooksScreen tagName={decodedTagName} />
}

