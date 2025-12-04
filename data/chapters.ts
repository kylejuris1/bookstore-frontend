// Unique chapter content for each book
export const BOOK_CHAPTERS: Record<string, Record<string, { title: string; content: string }>> = {
  "1": {
    // Whispers of Destiny
    "1": {
      title: "The Beginning",
      content: `The rain fell softly against the windowpane as Elena stood in the dimly lit bookstore. The smell of aged paper and leather bindings filled the air around her. She had always found solace in these quiet corners of the world, away from the noise and chaos of her everyday life.

As she traced her fingers along the spines of the books, a familiar warmth spread through her chest. This was her sanctuary, the place where she could escape reality and lose herself in infinite worlds.

Suddenly, the bell above the door chimed. Elena turned to see a stranger entering the shop, shaking raindrops from his dark coat. Their eyes met for just a moment, but it felt like an eternity.`,
    },
    "2": {
      title: "Fate's Design",
      content: `Over the following weeks, Elena found herself returning to the bookstore more frequently. She told herself it was for the books, but deep down, she knew the truth.

He was always there. Marcus, she learned his name was. A writer working on his first novel, spending his afternoons in the shop, seeking inspiration from the written words that lined the shelves.`,
    },
    "3": {
      title: "Undeniable Chemistry",
      content: `The weeks turned into months, and Marcus and Elena's connection deepened with each passing day. They had become inseparable, spending hours discussing everything from their dreams to their deepest fears.

One evening, as the sun painted the sky in shades of orange and pink, Marcus took Elena's hand and led her to the rooftop of the building next to the bookstore.`,
    },
  },
  "2": {
    // Hearts Entwined
    "1": {
      title: "First Encounter",
      content: `Sofia had never believed in love at first sight—until she saw him across the crowded café. His eyes met hers, and in that instant, something shifted deep within her soul. It was as if the universe had been waiting for this exact moment to align their paths.

She quickly looked away, her heart racing. What was happening to her? She was a practical woman, a successful architect who didn't have time for romantic fantasies.`,
    },
    "2": {
      title: "The Coffee Shop",
      content: `The next day, Sofia found herself at the same café at the same time. She told herself it was coincidence, but when he walked in and their eyes met again, she knew it wasn't.

"Hi," he said, approaching her table. "I'm Alex. I couldn't help but notice you yesterday."`,
    },
    "3": {
      title: "Growing Closer",
      content: `As the days turned into weeks, Sofia and Alex's relationship blossomed. They discovered they shared a love for architecture, art, and late-night conversations that stretched until dawn.

Sofia found herself falling deeper with each passing day, her carefully constructed walls crumbling in the face of something she couldn't deny.`,
    },
  },
  "3": {
    // Moonlit Secrets
    "1": {
      title: "The Disappearance",
      content: `Detective Isabella Chen stood in the rain-soaked alley, her flashlight cutting through the darkness. Another missing person case, another mystery that seemed to have no answers. But something about this one felt different.

The victim's apartment was pristine, too perfect. As if someone had carefully staged every detail. Isabella's instincts told her this wasn't a simple disappearance.`,
    },
    "2": {
      title: "The Clue",
      content: `Hidden beneath the floorboards, Isabella found a small leather-bound journal. The pages were filled with cryptic messages and dates that didn't make sense. But one entry caught her attention—a name she recognized from a cold case file.

"James Morrison," she whispered, her mind racing. What connection did he have to this?`,
    },
    "3": {
      title: "The Connection",
      content: `As Isabella dug deeper, she uncovered a web of secrets that spanned decades. The missing person wasn't just a victim—they were a key piece in a puzzle that had been waiting to be solved.

But the closer she got to the truth, the more dangerous her investigation became. Someone was watching, and they didn't want her to find the answers.`,
    },
  },
  "4": {
    // Eternal Flames
    "1": {
      title: "The Prophecy",
      content: `In the ancient kingdom of Eldoria, a prophecy had been foretold for centuries. When the twin moons aligned, a chosen one would rise to save the realm from darkness. Amelia had never believed in such tales—until the moons began to align.

As a scholar, she had spent her life studying the old texts, but now she found herself living the very stories she had read about.`,
    },
    "2": {
      title: "The Awakening",
      content: `The power surged through Amelia's veins like liquid fire. She could feel the ancient magic awakening within her, responding to the celestial alignment. The kingdom's fate rested on her shoulders, but she wasn't alone.

A mysterious warrior named Kael had appeared, claiming to be her protector. But could she trust him?`,
    },
    "3": {
      title: "The Battle Begins",
      content: `Dark forces gathered at the kingdom's borders, their shadows stretching across the land. Amelia knew the time had come to embrace her destiny, but first she had to master the powers that threatened to consume her.

With Kael by her side, she prepared for the battle that would determine the fate of everything she held dear.`,
    },
  },
  "5": {
    // Broken Hearts Mend
    "1": {
      title: "The Divorce",
      content: `Sophie stared at the divorce papers on her kitchen table, the words blurring through her tears. After ten years of marriage, it was over. She had given everything to make it work, but sometimes love wasn't enough.

She felt broken, lost, unsure of who she was without him. The future stretched before her like an empty void, and she didn't know how to fill it.`,
    },
    "2": {
      title: "New Beginnings",
      content: `Six months later, Sophie had moved to a small coastal town, trying to start over. She opened a small bakery, finding solace in the rhythm of kneading dough and the warmth of the oven.

It was there she met Liam, a local carpenter with kind eyes and a gentle smile. He didn't try to fix her—he just saw her, really saw her, for the first time in years.`,
    },
    "3": {
      title: "Learning to Love Again",
      content: `Liam showed Sophie that her heart wasn't broken beyond repair. Piece by piece, he helped her rebuild herself, not into who she used to be, but into who she was meant to become.

Their love grew slowly, like a garden after winter, and Sophie realized that sometimes the most beautiful things come from the deepest pain.`,
    },
  },
  "6": {
    // Shadow of Tomorrow
    "1": {
      title: "The Package",
      content: `Emma Cross received the package on a Tuesday. No return address, no note—just a small wooden box that felt heavier than it should. Inside, she found a key and a photograph of a man she didn't recognize.

But something about his eyes was familiar, as if she'd seen them in a dream. The key felt warm in her hand, and she knew her life was about to change forever.`,
    },
    "2": {
      title: "The Investigation",
      content: `The key led Emma to an abandoned warehouse on the edge of town. Inside, she discovered files, photographs, and evidence of a conspiracy that went deeper than she could have imagined.

The man in the photograph was her father, a man she thought had died when she was a child. But the evidence suggested he was still alive—and in danger.`,
    },
    "3": {
      title: "The Truth",
      content: `As Emma followed the trail of clues, she uncovered a web of lies that had been carefully constructed over decades. Her father wasn't who she thought he was, and neither was she.

The truth would change everything, but she had to find him before it was too late.`,
    },
  },
}

// Generate chapters 4-30 for each book with placeholder content
const generateChapters = () => {
  const bookTitles = [
    "Whispers of Destiny",
    "Hearts Entwined",
    "Moonlit Secrets",
    "Eternal Flames",
    "Broken Hearts Mend",
    "Shadow of Tomorrow",
  ]

  for (let bookId = 1; bookId <= 6; bookId++) {
    for (let chapterNum = 4; chapterNum <= 30; chapterNum++) {
      if (!BOOK_CHAPTERS[String(bookId)]) {
        BOOK_CHAPTERS[String(bookId)] = {}
      }
      BOOK_CHAPTERS[String(bookId)][String(chapterNum)] = {
        title: `Chapter ${chapterNum}`,
        content: `This is chapter ${chapterNum} of "${bookTitles[bookId - 1]}". The story continues as our characters face new challenges and discover deeper truths about themselves and the world around them. Each chapter builds upon the last, weaving a complex narrative that keeps readers engaged and eager to discover what happens next.

The plot thickens, relationships deepen, and mysteries unfold as we journey through this captivating tale.`,
      }
    }
  }
}

generateChapters()

export const getChaptersForBook = (bookId: string) => {
  return BOOK_CHAPTERS[bookId] || {}
}

export const getChapter = (bookId: string, chapterNum: string) => {
  return BOOK_CHAPTERS[bookId]?.[chapterNum] || null
}

export const getTotalChapters = (bookId: string) => {
  return Object.keys(BOOK_CHAPTERS[bookId] || {}).length
}

