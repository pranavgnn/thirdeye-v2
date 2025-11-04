const MOTOR_VEHICLE_ACT_RULES = [
  {
    ruleId: "mva-section-3",
    ruleTitle: "Driving at dangerous speed",
    ruleText:
      "No person shall drive a motor vehicle at a speed which is dangerous to the public having regard to all circumstances of the case, including the nature, condition, and use of the road and the amount of traffic which actually is at the time or might reasonably be expected to be thereon.",
    section: "3",
    category: "speeding",
    fineAmountRupees: 500,
    violationTypes: ["speeding", "rash_driving"],
  },
  {
    ruleId: "mva-section-5",
    ruleTitle: "Violation of traffic signals",
    ruleText:
      "Driving through a red traffic signal is prohibited. Traffic signals must be obeyed as per the Indian Road Signs regulation.",
    section: "5",
    category: "red_light",
    fineAmountRupees: 1000,
    violationTypes: ["red_light"],
  },
  {
    ruleId: "mva-section-112",
    ruleTitle: "Duty of owner to permit inspection of vehicle",
    ruleText:
      "Every owner of a motor vehicle shall allow the vehicle to be inspected to ascertain that it is in a fit condition for being driven.",
    section: "112",
    category: "other",
    fineAmountRupees: 500,
    violationTypes: ["other"],
  },
  {
    ruleId: "mva-section-177",
    ruleTitle: "Riding without crash helmet",
    ruleText:
      "No motorcycle or scooter rider shall ride without wearing an Indian Standards Institution (ISI) marked crash helmet or riding jacket.",
    section: "177",
    category: "helmet_violation",
    fineAmountRupees: 500,
    violationTypes: ["helmet_violation"],
  },
  {
    ruleId: "mva-section-134",
    ruleTitle: "Duty of driver to wear seatbelt",
    ruleText:
      "Every person driving a motor car shall wear a seatbelt while driving. The owner shall ensure that every occupant of the vehicle wears a seatbelt.",
    section: "134",
    category: "seatbelt_violation",
    fineAmountRupees: 500,
    violationTypes: ["seatbelt_violation"],
  },
  {
    ruleId: "mva-section-191",
    ruleTitle: "Mobile phone usage while driving",
    ruleText:
      "No person shall drive a motor vehicle while holding a mobile phone in hand or ear. Hands-free mode or voice commands are permitted.",
    section: "191",
    category: "phone_usage",
    fineAmountRupees: 1000,
    violationTypes: ["phone_usage"],
  },
  {
    ruleId: "mva-section-39",
    ruleTitle: "Number plates visibility",
    ruleText:
      "Every motor vehicle shall have number plates affixed as required under the law. The registration mark shall be kept clean and clearly visible.",
    section: "39",
    category: "no_license_plate",
    fineAmountRupees: 5000,
    violationTypes: ["no_license_plate"],
  },
  {
    ruleId: "mva-section-49",
    ruleTitle: "Rash or negligent driving",
    ruleText:
      "Whoever drives a motor vehicle in a manner which is rash or negligent and which endangers human life shall be liable for punishment.",
    section: "49",
    category: "rash_driving",
    fineAmountRupees: 1000,
    violationTypes: ["rash_driving"],
  },
  {
    ruleId: "mva-section-194",
    ruleTitle: "Duty of registration for motor vehicles",
    ruleText:
      "Every motor vehicle shall be registered with the local transport authority before being driven on any public road.",
    section: "194",
    category: "other",
    fineAmountRupees: 500,
    violationTypes: ["other"],
  },
  {
    ruleId: "mva-regulation-212",
    ruleTitle: "Parking violations",
    ruleText:
      "No motor vehicle shall be parked at locations where parking is prohibited as indicated by road signs or road markings.",
    section: "212",
    category: "wrong_parking",
    fineAmountRupees: 200,
    violationTypes: ["wrong_parking"],
  },
];

export { MOTOR_VEHICLE_ACT_RULES };
