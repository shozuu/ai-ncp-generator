<script setup>
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SidebarLayout from "@/layouts/SidebarLayout.vue";
import { exportUtils } from "@/utils/exportUtils";
import {
	ClipboardCheck,
	Activity,
	Target,
	Shield,
	BookOpen,
	CheckCircle,
	Star,
	ChevronDown,
	ChevronUp,
} from "lucide-vue-next";
import { ref } from "vue";

const ncpExplanations = ref([
	{
		section: "Assessment",
		icon: ClipboardCheck,
		content:
			"The assessment section includes subjective and objective data collected from the patient. Subjective data refers to the patient's verbalized symptoms, while objective data includes measurable findings such as vital signs.",
		example: {
			subjective: [
				"Reports severe headache, described as throbbing (8/10 on pain scale)",
				"States nausea and dizziness began this morning",
				"Complains of photophobia (sensitivity to light)",
			],
			objective: [
				"Blood pressure: 140/90 mmHg",
				"Temperature: 38.5°C",
				"Pupils equal and reactive to light (PERL)",
				"Facial grimacing observed during head movement",
			],
		},
	},
	{
		section: "Diagnosis",
		icon: Activity,
		content:
			"The diagnosis section identifies the primary nursing diagnosis using NANDA-I terminology. It should include the type of diagnosis (actual, risk, or wellness) and supporting evidence.",
		example:
			"Acute Pain related to physiological factors (possible migraine) as evidenced by reports of severe throbbing headache (8/10), facial grimacing, and elevated blood pressure.",
	},
	{
		section: "Outcomes",
		icon: Target,
		content:
			"The outcomes section defines both short-term and long-term goals for the patient. Goals should be SMART (Specific, Measurable, Attainable, Realistic, Time-Oriented).",
		example: [
			"Short-term Goal: Patient will report a decrease in headache pain to a level of 4/10 or less within 2 hours of intervention.",
			"Long-term Goal: Patient will verbalize understanding of headache triggers and management strategies prior to discharge.",
		],
	},
	{
		section: "Interventions",
		icon: Shield,
		content:
			"The interventions section outlines the specific nursing actions to address the identified problems and achieve the desired outcomes.",
		example: [
			"Administer prescribed analgesics as needed for pain relief.",
			"Provide a quiet and dark environment to reduce photophobia.",
			"Encourage the patient to rest and avoid strenuous activities.",
		],
	},
	{
		section: "Rationale",
		icon: BookOpen,
		content:
			"The rationale section explains the reasoning behind each nursing intervention, linking it to evidence-based practice.",
		example: [
			"Administering analgesics helps to reduce pain and improve patient comfort.",
			"A quiet and dark environment minimizes sensory stimuli, reducing headache severity.",
			"Rest promotes recovery and prevents exacerbation of symptoms.",
		],
	},
	{
		section: "Implementation",
		icon: CheckCircle,
		content:
			"The implementation section documents the actual execution of the planned interventions.",
		example: [
			"Administered 500mg acetaminophen at 10:00 AM.",
			"Dimmed the lights and closed the curtains in the patient’s room.",
			"Provided the patient with a cold compress for the forehead.",
		],
	},
	{
		section: "Evaluation",
		icon: Star,
		content:
			"The evaluation section assesses the effectiveness of the interventions in achieving the desired outcomes.",
		example: [
			"Patient reported a decrease in headache pain to 3/10 within 2 hours.",
			"Patient verbalized understanding of headache triggers and management strategies.",
			"Patient rested comfortably without further complaints of photophobia.",
		],
	},
]);

const expandedSections = ref([]);
const selectedFormat = ref("7"); // Default format

const toggleSection = (section) => {
	if (expandedSections.value.includes(section)) {
		expandedSections.value = expandedSections.value.filter((s) => s !== section);
	} else {
		expandedSections.value.push(section);
	}
};

// Export handlers
const handleExport = async (type) => {
	const dummyNCP = {
		assessment: "Assessment content here...",
		diagnosis: "Diagnosis content here...",
		outcomes: "Outcomes content here...",
		interventions: "Interventions content here...",
		rationale: "Rationale content here...",
		implementation: "Implementation content here...",
		evaluation: "Evaluation content here...",
	};
	switch (type) {
		case "pdf":
			await exportUtils.toPDF(dummyNCP);
			break;
		case "csv":
			exportUtils.toCSV(dummyNCP);
			break;
		case "word":
			exportUtils.toWord(dummyNCP);
			break;
		case "png":
			exportUtils.toPNG(dummyNCP);
			break;
	}
};
</script>

<template>
	<PageHead title="- NCP Explanations" />
	<SidebarLayout>
		<div class="space-y-8">
			<!-- Header -->
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold font-poppins">NCP Component Explanations</h1>
					<p class="text-muted-foreground">
						Learn about each component of a nursing care plan and how to create one that
						adheres to NNN standards.
					</p>
				</div>

				<!-- Format and Export Options -->
				<div class="flex space-x-4">
					<DropdownMenu>
						<DropdownMenuTrigger as-child>
							<Button variant="outline" size="sm" class="hover:bg-muted/10">
								Format: {{ selectedFormat }} Columns
								<ChevronDown class="w-4 h-4 ml-2" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent class="w-40">
							<DropdownMenuItem
								v-for="format in ['4', '5', '6', '7']"
								:key="format"
								@click="selectedFormat = format"
							>
								{{ format }} Columns
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger as-child>
							<Button variant="outline" size="sm" class="hover:bg-muted/10">
								Export as
								<ChevronDown class="w-4 h-4 ml-2" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent class="w-40">
							<DropdownMenuItem @click="handleExport('pdf')"
								>Export as PDF</DropdownMenuItem
							>
							<DropdownMenuItem @click="handleExport('csv')"
								>Export as CSV</DropdownMenuItem
							>
							<DropdownMenuItem @click="handleExport('word')"
								>Export as Word</DropdownMenuItem
							>
							<DropdownMenuItem @click="handleExport('png')"
								>Export as PNG</DropdownMenuItem
							>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<!-- Explanation Cards -->
			<div class="space-y-6">
				<Card
					v-for="(explanation, index) in ncpExplanations"
					:key="index"
					class="border border-muted shadow-sm hover:shadow-md transition-shadow cursor-pointer"
					@click="toggleSection(explanation.section)"
				>
					<CardHeader class="flex justify-between items-center">
						<div class="flex items-center space-x-2">
							<component :is="explanation.icon" class="w-5 h-5 text-primary" />
							<h3 class="text-lg font-semibold">{{ explanation.section }}</h3>
						</div>
						<ChevronDown
							v-if="!expandedSections.includes(explanation.section)"
							class="w-4 h-4 ml-1 text-primary"
						/>
						<ChevronUp
							v-if="expandedSections.includes(explanation.section)"
							class="w-4 h-4 ml-1 text-primary"
						/>
					</CardHeader>
					<CardContent
						v-if="expandedSections.includes(explanation.section)"
						class="space-y-4 transition-all duration-300"
					>
						<p class="text-muted-foreground">{{ explanation.content }}</p>
						<div v-if="explanation.example" class="space-y-4">
							<div v-if="explanation.example.subjective">
								<h4 class="font-semibold">Subjective Example:</h4>
								<ul class="list-disc list-inside text-sm text-muted-foreground">
									<li v-for="(item, i) in explanation.example.subjective" :key="i">
										{{ item }}
									</li>
								</ul>
							</div>
							<div v-if="explanation.example.objective">
								<h4 class="font-semibold">Objective Example:</h4>
								<ul class="list-disc list-inside text-sm text-muted-foreground">
									<li v-for="(item, i) in explanation.example.objective" :key="i">
										{{ item }}
									</li>
								</ul>
							</div>
							<div v-if="typeof explanation.example === 'string'">
								<p class="text-sm text-muted-foreground">
									{{ explanation.example }}
								</p>
							</div>
							<div v-if="Array.isArray(explanation.example)">
								<ul class="list-disc list-inside text-sm text-muted-foreground">
									<li v-for="(item, i) in explanation.example" :key="i">
										{{ item }}
									</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</SidebarLayout>
</template>
