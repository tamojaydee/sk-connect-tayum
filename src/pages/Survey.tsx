import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyFormData {
  // Profile Section
  lastName: string;
  givenName: string;
  middleName: string;
  suffix: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  purokZone: string;
  sex: "male" | "female";
  age: string;
  emailAddress: string;
  birthday: string;
  contactNumber: string;
  
  // Demographic Characteristics
  civilStatus: string;
  youthClassification: string[];
  youthAgeGroup: string;
  educationalBackground: string;
  workStatus: string;
  specialCategories: string[];
  registeredSKVoter: "yes" | "no";
  registeredNationalVoter: "yes" | "no";
  skAssemblyAttended: "yes" | "no";
  skAssemblyFrequency: string;
  skElectionVoted: "yes" | "no";
  skElectionFrequency: string;
  noSKAssemblyReason: string;
}

const Survey = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SurveyFormData>();
  
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fallbackBarangays = [
    { id: "48649d38-1d1e-4479-97a5-fd3091d1e587", name: "Baggalay" },
    { id: "0a81c908-dcbd-44df-aea2-09362d996405", name: "Basbasa" },
    { id: "1c028f8b-aa45-49ae-8115-cdb01275108b", name: "Budac" },
    { id: "c68be595-b80e-43a3-b74b-b01f7a583214", name: "Bumagcat" },
    { id: "e9192e9d-c578-467f-89fd-899aaaaebf03", name: "Cabaroan" },
    { id: "e5e53e2d-c294-4ac9-b08e-af049ebbc3ce", name: "Deet" },
    { id: "014df4c9-e234-4eb9-a39b-28998b23e890", name: "Gaddani" },
    { id: "dc9c58fc-a035-4a0e-9a32-e285c976ab51", name: "Patucannay" },
    { id: "5a224c8a-4678-448a-a606-b1c059ff4aba", name: "Pias" },
    { id: "bc4bfd33-c5d0-4e1a-bb94-d14aadb88991", name: "Poblacion" },
    { id: "4a59e3b6-4e9a-42f6-a6c6-23cad568bba2", name: "Velasco" },
  ];

  const fetchBarangays = async () => {
    try {
      const { data, error } = await supabase
        .from("barangays")
        .select("id, name")
        .order("name");

      if (error) throw error;
      if (data && data.length > 0) {
        setBarangays(data);
      } else {
        console.warn("Barangays query returned empty. Using fallback list.");
        setBarangays(fallbackBarangays);
        toast({ title: "Using fallback", description: "Loaded default Tayum barangays.", variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching barangays:", error);
      setBarangays(fallbackBarangays);
      toast({ title: "Network issue", description: "Loaded default Tayum barangays.", variant: "default" });
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data: SurveyFormData) => {
    // Prevent accidental submit on earlier steps; advance instead
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    if (!selectedBarangay) {
      toast({
        title: "Error",
        description: "Please select a barangay",
        variant: "destructive",
      });
      return;
    }
  
    setIsSubmitting(true);
    try {
      const surveyData = {
        barangay_id: selectedBarangay,
        full_name: `${data.lastName}, ${data.givenName} ${data.middleName || ''} ${data.suffix || ''}`.trim(),
        age: parseInt(data.age),
        gender: data.sex,
        contact_number: data.contactNumber,
        email: data.emailAddress,
        address: `${data.purokZone || ''} ${data.barangay}, ${data.cityMunicipality}, ${data.province}`.trim(),
        has_participated: data.skAssemblyAttended === "yes",
        participation_type: data.civilStatus,
        duration_years: null,
        favorite_activity: data.skAssemblyFrequency,
        impact_description: data.noSKAssemblyReason,
        improvement_suggestions: null,
        interested_in_joining: data.registeredSKVoter === "yes",
        interest_areas: [],
        preferred_activities: [],
        available_time: data.youthAgeGroup,
      };

      const { error } = await supabase.from("surveys").insert([surveyData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your survey has been submitted successfully.",
      });

      // Reset form
      setCurrentStep(1);
      setSelectedBarangay("");
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
            SK Survey Questionnaire
          </h1>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20 mb-6">
            <p className="text-lg font-semibold text-primary mb-2">Good Day!</p>
            <p className="text-muted-foreground mb-3">
              We are currently conducting a study focused on assessing the demographic information of the Katipunan ng Kabataan.
              We would like to ask your participation by taking your time to answer this questionnaire.
              Please read the questions carefully and answer them accurately.
            </p>
            <p className="text-sm font-medium text-secondary">
              REST ASSURED THAT ALL INFORMATION GATHERED FROM THIS STUDY WILL BE TREATED WITH UTMOST CONFIDENTIALITY.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Profile Information */}
          {currentStep === 1 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl font-heading flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">I</span>
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Fields */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Name of the Respondent:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        {...register("lastName", { required: "Last name is required" })}
                        className="mt-1"
                      />
                      {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="givenName">Given Name</Label>
                      <Input 
                        id="givenName" 
                        {...register("givenName", { required: "Given name is required" })}
                        className="mt-1"
                      />
                      {errors.givenName && <p className="text-destructive text-sm mt-1">{errors.givenName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input 
                        id="middleName" 
                        {...register("middleName")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="suffix">Suffix</Label>
                      <Input 
                        id="suffix" 
                        {...register("suffix")}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Fields */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Location:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Input 
                        id="province" 
                        {...register("province", { required: "Province is required" })}
                        className="mt-1"
                        defaultValue="Abra"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cityMunicipality">City/Municipality</Label>
                      <Input 
                        id="cityMunicipality" 
                        {...register("cityMunicipality", { required: "City/Municipality is required" })}
                        className="mt-1"
                        defaultValue="Tayum"
                      />
                    </div>
                    <div>
                      <Label htmlFor="barangay">Barangay</Label>
                      <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay.id} value={barangay.id}>
                              {barangay.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="purokZone">Purok/Zone</Label>
                      <Input 
                        id="purokZone" 
                        {...register("purokZone")}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Sex Assigned by Birth:</Label>
                    <RadioGroup 
                      onValueChange={(value) => setValue("sex", value as "male" | "female")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      type="number"
                      {...register("age", { required: "Age is required" })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input 
                      id="emailAddress" 
                      type="email"
                      {...register("emailAddress", { required: "Email is required" })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input 
                      id="contactNumber" 
                      {...register("contactNumber", { required: "Contact number is required" })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="birthday">Birthday (MM/DD/YYYY)</Label>
                  <Input 
                    id="birthday" 
                    type="date"
                    {...register("birthday", { required: "Birthday is required" })}
                    className="mt-1 max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Demographic Characteristics */}
          {currentStep === 2 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl font-heading flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">II</span>
                  Demographic Characteristics
                </CardTitle>
                <p className="text-muted-foreground">Please put a check mark next to the word or phrase that matches your response.</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Civil Status */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Civil Status:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Single", "Married", "Widowed", "Divorced", "Separated", "Annulled", "Unknown", "Live In"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`civil-${status}`} 
                          onCheckedChange={(checked) => {
                            if (checked) setValue("civilStatus", status);
                          }}
                        />
                        <Label htmlFor={`civil-${status}`} className="text-sm">{status}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Youth Classification */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Youth Classification:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["In School Youth", "Out School Youth", "Working Youth", "Youth w/ Specific needs"].map((classification) => (
                      <div key={classification} className="flex items-center space-x-2">
                        <Checkbox id={`youth-${classification}`} />
                        <Label htmlFor={`youth-${classification}`} className="text-sm">{classification}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Youth Age Group */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Youth Age Group:</Label>
                  <div className="space-y-2">
                    {[
                      "Child Youth (15-17 years old)",
                      "Core Youth (18-24 years old)", 
                      "Young Adult (25-30 years old)"
                    ].map((ageGroup) => (
                      <div key={ageGroup} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`age-${ageGroup}`}
                          onCheckedChange={(checked) => {
                            if (checked) setValue("youthAgeGroup", ageGroup);
                          }}
                        />
                        <Label htmlFor={`age-${ageGroup}`} className="text-sm">{ageGroup}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Educational Background */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Educational Background:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Elementary Level", "Elementary Graduate", "High School Level", "High School Graduate",
                      "Vocational Graduate", "College Level", "College Graduate", "Masters Level",
                      "Masters Graduate", "Doctorate Level", "Doctorate Graduate"
                    ].map((education) => (
                      <div key={education} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edu-${education}`}
                          onCheckedChange={(checked) => {
                            if (checked) setValue("educationalBackground", education);
                          }}
                        />
                        <Label htmlFor={`edu-${education}`} className="text-sm">{education}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Status */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Work Status:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Employed", "Unemployed", "Self Employed", 
                      "Currently looking for a Job", "Not Interested Looking for a Job"
                    ].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`work-${status}`}
                          onCheckedChange={(checked) => {
                            if (checked) setValue("workStatus", status);
                          }}
                        />
                        <Label htmlFor={`work-${status}`} className="text-sm">{status}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Categories */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Special Categories:</Label>
                  <div className="space-y-2">
                    {["Person with Disability", "Children in Conflict with Law", "Indigenous People"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox id={`special-${category}`} />
                        <Label htmlFor={`special-${category}`} className="text-sm">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Participation & Voting */}
          {currentStep === 3 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl font-heading flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">III</span>
                  Participation & Voting History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SK Voter Registration */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Registered SK Voter?</Label>
                  <RadioGroup onValueChange={(value) => setValue("registeredSKVoter", value as "yes" | "no")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="sk-voter-yes" />
                      <Label htmlFor="sk-voter-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sk-voter-no" />
                      <Label htmlFor="sk-voter-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* National Voter Registration */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Registered National Voter?</Label>
                  <RadioGroup onValueChange={(value) => setValue("registeredNationalVoter", value as "yes" | "no")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="national-voter-yes" />
                      <Label htmlFor="national-voter-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="national-voter-no" />
                      <Label htmlFor="national-voter-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* SK Assembly Attendance */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Have you already attended a SK Assembly?</Label>
                  <RadioGroup onValueChange={(value) => setValue("skAssemblyAttended", value as "yes" | "no")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="assembly-yes" />
                      <Label htmlFor="assembly-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="assembly-no" />
                      <Label htmlFor="assembly-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Assembly Frequency */}
                <div>
                  <Label className="text-base font-medium mb-3 block">If Yes, How many times?</Label>
                  <RadioGroup onValueChange={(value) => setValue("skAssemblyFrequency", value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-2 Times" id="freq-1-2" />
                      <Label htmlFor="freq-1-2">1-2 Times</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-4 Times" id="freq-3-4" />
                      <Label htmlFor="freq-3-4">3-4 Times</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5 and above" id="freq-5-above" />
                      <Label htmlFor="freq-5-above">5 and above</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* SK Election Voting */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Did you vote last SK Election?</Label>
                  <RadioGroup onValueChange={(value) => setValue("skElectionVoted", value as "yes" | "no")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="election-yes" />
                      <Label htmlFor="election-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="election-no" />
                      <Label htmlFor="election-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reason for not attending */}
                <div>
                  <Label className="text-base font-medium mb-3 block">If No, Why?</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="reason-no-meeting" />
                      <Label htmlFor="reason-no-meeting" className="text-sm">There was no SK Assembly Meeting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="reason-not-interested" />
                      <Label htmlFor="reason-not-interested" className="text-sm">Not Interested to Attend</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90"
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Complete Survey"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Survey;