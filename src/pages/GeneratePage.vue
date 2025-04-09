<script setup>
import AssessmentForm from "@/components/ncp/AssessmentForm.vue";
import FormatSelector from "@/components/ncp/FormatSelector.vue";
import NCPDisplay from "@/components/ncp/NCPDisplay.vue";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingIndicator from "@/components/ui/loading/LoadingIndicator.vue";
import { useToast } from "@/components/ui/toast";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { ncpService } from "@/services/ncpService";
import { ref } from "vue";
import {
	Info,
	CheckCircle,
	ClipboardMinus,
	ChevronDown,
	ChevronUp,
} from "lucide-vue-next";

const selectedFormat = ref("7");
const isLoading = ref(false);
const generatedNCP = ref(null);
const showExampleFormat = ref(false); // Toggle state for the example format
const { toast } = useToast();

const handleFormatChange = (format) => {
	selectedFormat.value = format;
};

const handleAssessmentSubmit = async (formData) => {
	isLoading.value = true;
	generatedNCP.value = null;

	try {
		const result = await ncpService.generateNCP(formData);
		generatedNCP.value = result;
		toast({
			title: "Success",
			description: "NCP generated successfully",
		});
	} catch (error) {
		toast({
			title: "Error",
			description: error.message,
			variant: "destructive",
		});
	} finally {
		isLoading.value = false;
	}
};
</script>

<template>
	<PageHead title="- Generate NCP" />
	<DefaultLayout>
		<div class="space-y-8">
			<div>
				<h1 class="font-poppins text-3xl font-bold">Generate Nursing Care Plan</h1>
				<p class="text-muted-foreground mt-2">
					Create an AI-generated nursing care plan based on patient data
				</p>
			</div>

			<!-- Format Selection -->
			<Card v-if="!generatedNCP">
				<CardHeader>
					<h3 class="text-lg font-semibold">Format Selection</h3>
					<p class="text-muted-foreground text-sm">
						Choose how many columns you want to display in your NCP
					</p>
				</CardHeader>
				<CardContent>
					<FormatSelector :format="selectedFormat" @update:format="handleFormatChange" />
				</CardContent>
			</Card>

			<!-- Assessment Form -->
			<Card v-if="!generatedNCP">
				<CardHeader>
					<h3 class="text-lg font-semibold">Patient Assessment</h3>
					<p class="text-muted-foreground text-sm">
						Enter your assessment details to generate an NCP
					</p>
				</CardHeader>
				<CardContent>
					<div class="border-muted pt-4 space-y-6 border-t">
						<!-- Formatting Tips Section -->
						<div class="space-y-2">
							<div class="flex items-center space-x-2">
								<Info class="w-5 h-5 text-primary" />
								<p class="text-muted-foreground text-sm font-medium">Formatting Tips:</p>
							</div>
							<ul
								class="text-muted-foreground space-y-1 text-sm list-disc list-inside pl-4"
							>
								<li>Enter each finding on a new line.</li>
								<li>Use clear and concise statements.</li>
								<li>Separate distinct observations for better clarity.</li>
							</ul>
						</div>

						<!-- Example Format Toggle -->
						<div>
							<button
								class="flex items-center text-primary text-sm font-medium hover:underline"
								@click="showExampleFormat = !showExampleFormat"
							>
								<span v-if="showExampleFormat">Hide Example Format</span>
								<span v-else>Show Example Format</span>
								<ChevronDown v-if="!showExampleFormat" class="w-4 h-4 ml-1" />
								<ChevronUp v-if="showExampleFormat" class="w-4 h-4 ml-1" />
							</button>
						</div>

						<!-- Example Format Section -->
						<div v-if="showExampleFormat" class="bg-muted/30 p-4 rounded-md shadow-sm">
							<p
								class="text-muted-foreground mb-3 text-sm font-medium flex items-center space-x-2"
							>
								<CheckCircle class="w-5 h-5 text-primary" />
								<span>Example Format:</span>
							</p>

							<!-- Subjective Example -->
							<div class="space-y-2">
								<div>
									<p
										class="text-muted-foreground text-sm font-semibold flex items-center space-x-2"
									>
										<ClipboardMinus class="w-4 h-4" />
										<span>Subjective Data:</span>
									</p>
									<ul class="text-muted-foreground text-sm list-disc list-inside pl-4">
										<li>Reports severe headache (8/10 pain scale)</li>
										<li>Reports nausea and dizziness</li>
										<li>Complains of sensitivity to light</li>
									</ul>
								</div>

								<!-- Objective Example -->
								<div>
									<p
										class="text-muted-foreground text-sm font-semibold flex items-center space-x-2"
									>
										<ClipboardMinus class="w-4 h-4" />
										<span>Objective Data:</span>
									</p>
									<ul class="text-muted-foreground text-sm list-disc list-inside pl-4">
										<li>Blood pressure: 140/90 mmHg</li>
										<li>Temperature: 38.5°C</li>
										<li>Pupils equally reactive to light</li>
										<li>Facial grimacing noted</li>
									</ul>
								</div>
							</div>
						</div>

						<!-- Assessment Form -->
						<AssessmentForm
							@submit="handleAssessmentSubmit"
							:selectedFormat="selectedFormat"
						/>
					</div>
				</CardContent>
			</Card>

			<!-- Loading State -->
			<Card v-if="isLoading">
				<CardContent>
					<LoadingIndicator text="Generating your nursing care plan..." />
				</CardContent>
			</Card>

			<!-- Generated NCP Display -->
			<NCPDisplay
				v-if="generatedNCP && !isLoading"
				:ncp="generatedNCP"
				:format="selectedFormat"
			/>
		</div>
	</DefaultLayout>
</template>
