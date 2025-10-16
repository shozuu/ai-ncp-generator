// Test script to demonstrate the structured to text conversion
import {
  convertStructuredToText,
  convertTextToStructured,
} from '@/utils/structuredToTextConverter'

// Example structured diagnosis data
const diagnosisData = {
  statement:
    'Acute Pain related to physical injury agent as evidenced by pain scale of 7/10, facial grimace, pallor, restlessness, and diaphoresis with HR 115 bpm',
}

// Example structured outcomes data
const outcomesData = {
  short_term: {
    timeframes: [
      {
        timeframe: 'Within 24 hours of nursing interventions',
        outcomes: [
          'The client will report pain level 3 or below consistently',
          'The patient will demonstrate use of at least two non-pharmacological pain relief techniques independently',
        ],
      },
    ],
  },
  long_term: {
    timeframes: [
      {
        timeframe: 'Within 48 hours of nursing interventions',
        outcomes: [
          'The patient will participate in activities of daily living without significant pain interference',
          'The patient will maintain vital signs within normal limits during rest and activity',
        ],
      },
    ],
  },
}

// Example structured interventions data
const interventionsData = {
  independent: [
    {
      intervention:
        'Administer prescribed analgesic medications as ordered, evaluating effectiveness 30-60 minutes after administration with pain scale assessment',
      id: 'independent_0',
    },
    {
      intervention:
        'Implement around-the-clock pain medication schedule as prescribed to maintain therapeutic blood levels and prevent pain escalation',
      id: 'independent_1',
    },
  ],
  dependent: [
    {
      intervention:
        'Notify physician if pain level remains at 7 or above after interventions, or if patient exhibits signs of inadequate pain control requiring medication adjustment',
      id: 'dependent_0',
    },
  ],
  collaborative: [
    {
      intervention:
        'Pain management specialists provide expertise in complex pain situations, offer advanced interventional options, and ensure comprehensive multimodal approaches when standard treatments are insufficient',
      id: 'collaborative_0',
    },
  ],
}

console.log('=== DIAGNOSIS CONVERSION TEST ===')
const diagnosisText = convertStructuredToText(diagnosisData, 'diagnosis')
console.log('Structured to Text:', diagnosisText)
const diagnosisBack = convertTextToStructured(diagnosisText, 'diagnosis')
console.log('Text back to Structured:', diagnosisBack)

console.log('\n=== OUTCOMES CONVERSION TEST ===')
const outcomesText = convertStructuredToText(outcomesData, 'outcomes')
console.log('Structured to Text:\n', outcomesText)
const outcomesBack = convertTextToStructured(outcomesText, 'outcomes')
console.log('Text back to Structured:', JSON.stringify(outcomesBack, null, 2))

console.log('\n=== INTERVENTIONS CONVERSION TEST ===')
const interventionsText = convertStructuredToText(
  interventionsData,
  'interventions'
)
console.log('Structured to Text:\n', interventionsText)
const interventionsBack = convertTextToStructured(
  interventionsText,
  'interventions'
)
console.log(
  'Text back to Structured:',
  JSON.stringify(interventionsBack, null, 2)
)
