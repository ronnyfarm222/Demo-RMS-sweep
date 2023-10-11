import './add-candidate.component.scss';

import { faFileUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ArrowBack } from '@mui/icons-material';
import { Autocomplete, Box, Button, Chip, Grid, TextField, Typography } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { MuiTelInput } from 'mui-tel-input';
import { useSnackbar } from 'notistack';
import React, { useContext, useState, useEffect, useRef, ChangeEvent } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    ACCEPTED_FILES,
    CANCEL_NEW_REQ_POPUP_TEXT,
    CANDIDATEJOBTITLE,
    CANDIDATE_JOB_TITLE,
    CANDIDATE_NOTICE_PERIOD,
    CONTACT_NO,
    COUNTER_OFFER_DETAILS,
    CURRENT_CTC,
    CURRENT_LOCATION,
    EDUCATION_GAP_REASON,
    EMAIL_ID,
    EXPECTED_CTC,
    FAILURE_POPUP,
    FILE_UPLOAD,
    FIRST_NAME,
    HIGHEST_QUALIFICATION,
    LAST_NAME,
    LOCATION,
    MAX_FILE_SIZE_ERROR_MSG,
    ORGANIZATION_BRIEFING,
    PREFERRED_LOCATION,
    PRIMARY_SKILLS,
    PRIORITY,
    PROJECT,
    REASON_FOR_CHANGE,
    RELEVANT_EXPERIENCE_MONTH,
    RELEVANT_EXPERIENCE_YEAR,
    REL_EXPERIENCE_ERROR_MSG,
    REMARK,
    RESUME_FILE,
    RMS_API,
    SOURCE,
    SOURCE_NAME,
    SUCCESS_ADD_CANDIDATE_MESSAGE,
    TAMEMBER,
    TOTAL_EXPERIENCE_MONTH,
    TOTAL_EXPERIENCE_YEAR,
    VALIDATION_ERRORS,
    VALID_EMPLOYMENT_DOCUMENTS,
    WORKINGMODE,
    WORK_TENURE_GAP_REASON,
} from '../../../constants';
import { AddCandidateModel, IMSData, AddCandidateErrors } from '../../../models';
import { http } from '../../../service';
import ImsLoader from '../../../shared/ims-loader/ims-loader.component';
import SnackbarButtons from '../../../shared/snackbar-buttons/snackbar-buttons.component';
import { IMSContext } from '../../../utils/context';

function addCandidate() {
    const [apiValue, setApiValue] = useState({
        locationArray: [],

        skillsArray: [],

        jobArray: [],
        sourceArray: [],
    });
    const [locationOptions, setLocation] = useState([]);
    const navigate = useNavigate();
    const imsData: IMSData = useContext<IMSData>(IMSContext);
    const [disable, setDisable] = useState(true);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [details, setDetails] = useState();
    const location: any = useLocation();
    const candidateData = location.state.data;
    const detailButtons = [
        {
            label: 'REQUIREMENT DETAILS',
            code: 'REQDTL',
        },
        {
            label: 'PERSONAL DETAILS',
            code: 'PERSONALDTL',
        },
        {
            label: 'EXPERIENCE AND EDUCATION',
            code: 'EXPDTL',
        },
        {
            label: 'CTC AND COUNTER OFFER',
            code: 'CTCDTL',
        },
        {
            label: 'OTHER DETAILS',
            code: 'OTHRDTL',
        },
    ];

    const initialErrors: AddCandidateErrors = new AddCandidateErrors();
    const initialStates: AddCandidateModel = candidateData ? candidateData : new AddCandidateModel();
    const fileInput = React.createRef<HTMLInputElement>();
    const [addCandidate, setAddCandidate] = useState<AddCandidateModel>(initialStates);
    const [errorValue, setErrorValue] = useState<AddCandidateErrors>(initialErrors);

    const [viewMode, setViewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationAccess, setLocationAccess] = useState(true);

    useEffect(() => {
        getData();
    }, []);

    const phoneHandleChange = (CNO: string) => {
        validate('contactNo', CNO);
        setAddCandidate({
            ...addCandidate,
            candidateContactNo: CNO,
        });
    };
    const reqRef = useRef<any>(null);
    const personalDetailsRef = useRef<any>(null);
    const experienceAndEducationRef = useRef<any>(null);
    const ctcAndCounterOfferRef = useRef<any>(null);
    const otherDetailsRef = useRef<any>(null);

    const getData = async () => {
        setLoading(true);
        try {
            const res = await Promise.all([
                await http.get(RMS_API.LOCATIONS),

                await http.get(RMS_API.SKILLS),

                await http.get(RMS_API.JOBS),
                await http.get(RMS_API.SOURCE),
            ]);

            const data = res?.map((res: any) => res.data);

            const filterJobs = data[2].filter((job: any) => job.isJobActive == true);

            setApiValue((apiValue) => ({
                ...apiValue,

                locationArray: data[0],

                skillsArray: data[1],

                jobArray: filterJobs,
                sourceArray: data[3],
            }));
            setLoading(false);
        } catch {
            throw Error('Failed to fetch data');
        }
    };

    const validateFile = (name: string, value: any, size?: number) => {
        const errors = errorValue;
        const file: any = addCandidate.resumeFileName;
        if (name == 'resume File' && value === '') {
            errors.resumeFileNameError = VALIDATION_ERRORS.RESUME_FILE_ERROR;
        }
        if (size && size > 5242880) {
            setErrorValue((prevState) => {
                return { ...prevState, resumeFileNameError: MAX_FILE_SIZE_ERROR_MSG };
            });
            return false;
        }
        if (size === 0) {
            setErrorValue((prevState) => ({ ...prevState, resumeFileNameError: VALIDATION_ERRORS.RESUME_FILE_ERROR_MSG }));
            return false;
        }
        if (value == undefined || (value.length < 1 && !file)) {
            setErrorValue((prevState) => {
                return { ...prevState, resumeFileNameError: VALIDATION_ERRORS.RESUME_FILE_ERROR };
            });
            setAddCandidate({ ...addCandidate, [name]: value });
            return false;
        }
        const ext = value.substr(value.lastIndexOf('.')).toLowerCase();
        if (ext != '.pdf' && ext != '.docx' && ext != '.doc' && ext != '.txt' && ext != '.rtf' && !file?.name) {
            setErrorValue((prevState) => {
                return { ...prevState, resumeFileNameError: FILE_UPLOAD };
            });

            setAddCandidate({ ...addCandidate, [name]: value });
            return false;
        }

        return true;
    };

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        let isValid;
        const uploadedFile = event.target.files ? event.target.files[0] : null;

        if (!uploadedFile) {
            isValid = validateFile('resumeFile', ' ', 0);
        } else {
            isValid = validateFile(event.target.name, uploadedFile.name, uploadedFile.size);
        }

        if (isValid) {
            const addCandidateVal: any = { ...addCandidate };
            addCandidateVal[RESUME_FILE] = !uploadedFile ? addCandidate?.resumeFile : uploadedFile;
            addCandidateVal['resumeFileName'] = !uploadedFile ? addCandidate?.resumeFileName : uploadedFile.name;

            setAddCandidate({
                ...addCandidateVal,
            });
            {
                <FontAwesomeIcon className='ml-3' onClick={fileDeleteHandler} size='sm' icon={faTrash} />;
            }

            errorValue.resumeFileNameError = '';
        } else {
            setAddCandidate((prevState) => ({ ...prevState, resumeFileName: '' }));
        }
    };
    const handleChange = (event: any) => {
        const { name, value } = event.target;

        if (addCandidate.candidateTotalExperienceYear && addCandidate.candidateTotalExperienceMonth >= 0) {
            addCandidate.candidateTotalExperience = +addCandidate.candidateTotalExperienceYear * 12 + +addCandidate.candidateTotalExperienceMonth;
        }

        if (addCandidate.candidateRelevantExperienceYear && addCandidate.candidateRelevantExperienceMonth >= 0) {
            addCandidate.relevantExperience = +addCandidate.candidateRelevantExperienceYear * 12 + +addCandidate.candidateRelevantExperienceMonth;
        }
        setAddCandidate((addCandidate) => ({
            ...addCandidate,
            [event.target.name]: event.target.value,
        }));
        checkCombinedValidation();
        validate(name, value);

        validateCandidate();
    };

    const skills = apiValue.skillsArray?.map((skill: any) => skill.skillName);

    function resetForm() {
        setAddCandidate(initialStates);
        setErrorValue(initialErrors);
    }
    const clearFormData = (snackbarId: number) => (
        <SnackbarButtons
            actions={[
                {
                    name: 'Yes',
                    onClick: () => {
                        closeSnackbar(snackbarId);
                        resetForm();
                    },
                    actionColor: 'black',
                    actionBackground: 'none',
                },
                { name: 'Cancel', onClick: () => closeSnackbar(snackbarId), actionColor: 'black', actionBackground: 'danger' },
            ]}
        />
    );

    const checkSkills = (event: any) => {
        const { value } = event.target;
        let isError = false;
        const errors = errorValue;

        if (addCandidate.candidatePrimarySkills.length <= 0) {
            errors.candidatePrimarySkillsError = 'Skill is required';
            isError = true;
        } else {
            isError = false;
        }
    };
    const handleFormClose = (snackbarId: number) => (
        <SnackbarButtons
            actions={[
                {
                    name: 'Yes',
                    onClick: () => {
                        closeSnackbar(snackbarId);
                    },
                    actionColor: 'black',
                    actionBackground: 'none',
                },
                {
                    name: 'Dismiss',
                    onClick: () => {
                        closeSnackbar(snackbarId);
                        navigate('/candidates');
                    },
                    actionColor: 'red',
                    actionBackground: 'none',
                },
            ]}
        />
    );

    const experienceValidation = (value: string, maxLimit: number, caseValue: keyof typeof VALIDATION_ERRORS) => {
        if (value == undefined || value.length < 1) {
            return VALIDATION_ERRORS[caseValue];
        } else if (+value < 0 || +value > maxLimit) {
            return VALIDATION_ERRORS.INVALID_FIELD_ERROR;
        }
        return '';
    };

    const fileDeleteHandler = () => {
        setAddCandidate({
            ...addCandidate,
            resumeFileName: '',
            resumeUrl: '',
        });

        setErrorValue({
            ...errorValue,
            resumeFileNameError: VALIDATION_ERRORS.RESUME_FILE_ERROR,
        });

        validateCandidate();
    };

    const checkCombinedValidation = () => {
        const errors = errorValue;
        errors.relevantCombinedError = '';

        if (addCandidate.candidateTotalExperience < addCandidate.relevantExperience) {
            errors.relevantCombinedError = REL_EXPERIENCE_ERROR_MSG;
        }

        return;
    };

    const validate = (name: string, value: any, index?: number) => {
        const regEx = /^[\w\-.+]+@[a-zA-Z0-9.-]+.[a-zA-z0-9]{2,5}$/;

        const nameRegex = /^[a-zA-Z_. ]+$/;
        const emailRegex =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let isError = false;
        const errors = errorValue;

        switch (name) {
            case FIRST_NAME:
                errors.firstNameError = '';
                if (value.trim().length < 1) {
                    errors.firstNameError = VALIDATION_ERRORS.FIRST_NAME_ERROR;
                    isError = true;
                } else if (!nameRegex.test(String(value))) {
                    errors.firstNameError = VALIDATION_ERRORS.INVALID_FIELD_ERROR;
                    isError = true;
                }

                break;

            case LAST_NAME:
                errors.lastNameError = '';
                if (value.trim().length < 1) {
                    errors.lastNameError = VALIDATION_ERRORS.LAST_NAME_ERROR;
                    isError = true;
                } else if (!nameRegex.test(String(value))) {
                    errors.firstNameError = VALIDATION_ERRORS.INVALID_FIELD_ERROR;
                    isError = true;
                }

                break;

            case EMAIL_ID:
                errors.candidateEmailIdError = '';

                if (value.length < 1) {
                    errors.candidateEmailIdError = VALIDATION_ERRORS.EMAIL_ID_ERROR;
                    isError = true;
                } else if (!String(value).toLowerCase().match(emailRegex)) {
                    errors.candidateEmailIdError = VALIDATION_ERRORS.INVALID_FIELD_ERROR;
                    isError = true;
                }
                break;

            case CONTACT_NO:
                errors.candidateContactNoError = '';
                if (value == undefined || value.length < 1) {
                    errors.candidateContactNoError = VALIDATION_ERRORS.CONTACT_NO_ERROR;

                    isError = true;
                } else if (value != undefined && !value?.includes('+91') && !isValidPhoneNumber(value)) {
                    errors.candidateContactNoError = VALIDATION_ERRORS.CONTACT_NO_ERROR;

                    isError = true;
                } else {
                    const phoneNumber = value.replaceAll(' ', '').replace('+91', '');
                    if (phoneNumber.length < 10 || phoneNumber.length > 10) {
                        errors.candidateContactNoError = VALIDATION_ERRORS.INVALID_FIELD_ERROR;
                        isError = true;
                    }
                }

                break;

            case TOTAL_EXPERIENCE_YEAR: {
                errors.candidateTotalExperienceYearError = '';
                const expValidationVal = experienceValidation(value, 60, 'TOTAL_EXPERIENCE_ERROR');
                if (expValidationVal !== '') {
                    errors.relevantCombinedError = '';
                }
                errors.candidateTotalExperienceYearError = expValidationVal;
                setErrorValue((prev: any) => ({
                    ...prev,
                    candidateTotalExperienceYearError: expValidationVal,
                }));
                if (RELEVANT_EXPERIENCE_YEAR > TOTAL_EXPERIENCE_YEAR) {
                    setErrorValue((prev: any) => ({
                        ...prev,
                        candidateTotalExperienceMonthError: expValidationVal,
                    }));
                }
                break;
            }

            case TOTAL_EXPERIENCE_MONTH: {
                errors.candidateTotalExperienceMonthError = '';
                const expValidationVal = experienceValidation(value, 11, 'TOTAL_EXPERIENCE_ERROR');
                if (expValidationVal !== '') {
                    errors.relevantCombinedError = '';
                }
                errors.candidateTotalExperienceMonthError = expValidationVal;
                setErrorValue((prev: any) => ({
                    ...prev,
                    candidateTotalExperienceMonthError: expValidationVal,
                }));

                break;
            }

            case RELEVANT_EXPERIENCE_YEAR: {
                errors.candidateRelevantExperienceYearError = '';
                const expValidationVal = experienceValidation(value, 60, 'RELEVANT_EXPERIENCE_ERROR');
                if (expValidationVal !== '') {
                    errors.relevantCombinedError = '';
                }
                errors.candidateRelevantExperienceYearError = expValidationVal;
                setErrorValue((prev: any) => ({
                    ...prev,
                    relevantExperienceYearError: expValidationVal,
                }));
                if (RELEVANT_EXPERIENCE_YEAR > TOTAL_EXPERIENCE_YEAR) {
                    setErrorValue((prev: any) => ({
                        ...prev,
                        candidateTotalExperienceMonthError: expValidationVal,
                    }));
                }
                break;
            }

            case RELEVANT_EXPERIENCE_MONTH: {
                errors.candidateRelevantExperienceMonthError = '';
                const expValidationVal = experienceValidation(value, 11, 'RELEVANT_EXPERIENCE_ERROR');
                if (expValidationVal !== '') {
                    errors.relevantCombinedError = '';
                }
                errors.candidateRelevantExperienceMonthError = expValidationVal;
                setErrorValue((prev: any) => ({
                    ...prev,
                    relevantExperienceMonthError: expValidationVal,
                }));
                break;
            }

            case CURRENT_CTC:
                errors.currentCtcError = '';

                if (value < 0 || value == undefined || value == null || value == '') {
                    errors.currentCtcError = VALIDATION_ERRORS.CURRENT_CTC;

                    isError = true;
                }
                break;

            case EXPECTED_CTC:
                errors.expectedCtcError = '';

                if (value < 0 || value == undefined || value == null || value == '') {
                    errors.expectedCtcError = VALIDATION_ERRORS.EXPECTED_CTC;

                    isError = true;
                }
                break;
            case COUNTER_OFFER_DETAILS:
                errors.counterOfferDetailsError = '';

                if (value < 0 || value == undefined || value == null || value == '') {
                    errors.counterOfferDetailsError = VALIDATION_ERRORS.COUNTER_OFFER_DETAILS;

                    isError = true;
                }
                break;

            case WORK_TENURE_GAP_REASON:
                errors.workTenureGapReasonError = '';

                if (value < 0 || value == undefined || value == null || value == '') {
                    errors.workTenureGapReasonError = VALIDATION_ERRORS.WORK_TENURE_GAP_REASON;

                    isError = true;
                }
                break;

            case VALID_EMPLOYMENT_DOCUMENTS:
                errors.validEmploymentDocumentsError = '';

                if (value < 0 || value == undefined || value == null || value == '') {
                    errors.validEmploymentDocumentsError = VALIDATION_ERRORS.VALID_EMPLOYMENT_DOCUMENTS;

                    isError = true;
                }
                break;

            case SOURCE:
                errors.candidateProfileSourceError = '';

                if (value == null || value == '') {
                    errors.candidateProfileSourceError = VALIDATION_ERRORS.SOURCE;

                    isError = true;
                }
                break;
            case SOURCE_NAME:
                errors.candidateProfileSourceNameError = '';

                if (value == null || value == '') {
                    errors.candidateProfileSourceNameError = VALIDATION_ERRORS.SOURCE_NAME;

                    isError = true;
                }
                break;
            case REASON_FOR_CHANGE:
                errors.reasonForChangeError = '';

                if (value == null || value == '[]' || value == '') {
                    errors.reasonForChangeError = VALIDATION_ERRORS.REASON_FOR_CHANGE;

                    isError = true;
                }
                break;

            case ORGANIZATION_BRIEFING:
                errors.briefedAboutOrganizationError = '';

                if (value == null || value == '[]' || value == '') {
                    errors.briefedAboutOrganizationError = VALIDATION_ERRORS.ORGANIZATION_BRIEFING;

                    isError = true;
                }
                break;

            case REMARK:
                errors.remarkError = '';

                if (value == null || value == '[]' || value == '') {
                    errors.remarkError = VALIDATION_ERRORS.REMARK;

                    isError = true;
                }
                break;

            case CURRENT_LOCATION:
                errors.currentLocationError = '';

                if (value == null || value == '[]' || value == '') {
                    errors.currentLocationError = VALIDATION_ERRORS.CURRENT_LOCATION;

                    isError = true;
                }
                break;
            case HIGHEST_QUALIFICATION:
                errors.highestQualificationError = '';
                if (value == null || value == 0 || value == '') {
                    errors.highestQualificationError = VALIDATION_ERRORS.HIGHEST_QUALIFICATION;

                    isError = true;
                }

                break;

            case EDUCATION_GAP_REASON:
                errors.educationGapReasonError = '';

                if (value == null || value == '[]' || value == '') {
                    errors.educationGapReasonError = VALIDATION_ERRORS.EDUCATION_GAP_REASON;

                    isError = true;
                }
                break;

            case PRIMARY_SKILLS:
                errors.candidatePrimarySkillsError = '';

                if (value.length <= 0) {
                    errors.candidatePrimarySkillsError = 'Skill is required';
                    isError = true;
                } else {
                    errors.candidatePrimarySkillsError = '';
                    isError = false;
                }

                break;

            case WORKINGMODE:
                errors.preferredWorkModeError = '';

                if (value === undefined || value === null || value === '') {
                    errors.preferredWorkModeError = VALIDATION_ERRORS.WORKINGMODE_ERROR;

                    isError = true;
                }
                break;

            case CANDIDATEJOBTITLE:
                errors.candidateJobTitleError = '';

                if (value === null || value === '' || addCandidate.candidateJobTitle.length < 0) {
                    errors.candidateJobTitleError = VALIDATION_ERRORS.CANDIDATE_JOB_TITLE_ERROR;

                    isError = true;
                }

                break;

            case CANDIDATE_NOTICE_PERIOD:
                errors.candidateNoticePeriodError = '';

                if (!value || value.length < 1) {
                    errors.candidateNoticePeriodError = VALIDATION_ERRORS.NOTICE_PERIOD_ERROR;
                    isError = true;
                }
                if (value < 0 || value % 1 !== 0 || value > CANDIDATE_NOTICE_PERIOD) {
                    errors.candidateNoticePeriodError = VALIDATION_ERRORS.INVALID_FIELD_ERROR;
                    isError = true;
                }
                if (value > 366) {
                    errors.candidateNoticePeriodError = VALIDATION_ERRORS.INVALID_NOTICE_PERIOD_ERROR;
                }
                break;

            default:
                break;
        }

        if (isError) {
            return false;
        }

        return true;
    };
    const handleClick = (e: any) => {
        const value = e.target.value;
        setDetails(value);
        if (value == 'REQDTL') {
            reqRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (value == 'PERSONALDTL') {
            personalDetailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (value == 'EXPDTL') {
            experienceAndEducationRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (value == 'CTCDTL') {
            ctcAndCounterOfferRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (value == 'OTHRDTL') {
            otherDetailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };
    useEffect(() => {
        validateCandidate();
    }, [addCandidate]);

    const validateCandidate = () => {
        if (
            addCandidate.candidateJobTitle &&
            addCandidate.firstName &&
            addCandidate.lastName &&
            addCandidate.preferredWorkMode &&
            addCandidate.preferredLocation &&
            addCandidate.candidatePrimarySkills &&
            addCandidate.candidateSecondarySkills &&
            addCandidate.candidateNoticePeriod.toString() &&
            addCandidate.source &&
            addCandidate.sourceName &&
            addCandidate.buDetails.name &&
            addCandidate.candidateEmailId &&
            addCandidate.candidateContactNo &&
            addCandidate.highestQualification &&
            addCandidate.remark &&
            addCandidate.reasonForChange &&
            addCandidate.candidateTotalExperienceYear.toString() &&
            addCandidate.candidateTotalExperienceMonth.toString() &&
            addCandidate.currentCtc.toString() &&
            addCandidate.expectedCtc.toString() &&
            addCandidate.candidateRelevantExperienceYear.toString() &&
            addCandidate.candidateRelevantExperienceMonth.toString() &&
            addCandidate.briefedAboutOrganization &&
            addCandidate.validEmploymentDocuments &&
            addCandidate.resumeFileName &&
            addCandidate.workTenureGapReason &&
            addCandidate.counterOfferDetails &&
            addCandidate.educationGapReason &&
            addCandidate.currentLocation &&
            !(
                errorValue.candidateJobTitleError ||
                errorValue.firstNameError ||
                errorValue.lastNameError ||
                errorValue.candidateEmailIdError ||
                errorValue.candidateContactNoError ||
                errorValue.currentCtcError ||
                errorValue.expectedCtcError ||
                errorValue.candidateNoticePeriodError ||
                errorValue.projectNameError ||
                errorValue.reasonForChangeError ||
                errorValue.preferredWorkModeError ||
                errorValue.preferredLocationError ||
                errorValue.validEmploymentDocumentsError ||
                errorValue.counterOfferDetailsError ||
                errorValue.workTenureGapReasonError ||
                errorValue.remarkError ||
                errorValue.priorityError ||
                errorValue.candidateProfileSourceNameError ||
                errorValue.candidateProfileSourceError ||
                errorValue.resumeFileNameError ||
                errorValue.highestQualificationError ||
                errorValue.candidateTotalExperienceYearError ||
                errorValue.candidateTotalExperienceMonthError ||
                errorValue.briefedAboutOrganizationError ||
                errorValue.educationGapReasonError ||
                errorValue.currentLocationError
            )
        ) {
            setDisable(false);
        } else {
            setDisable(true);
        }
    };

    const submitData = async (e: any) => {
        e.preventDefault();
        errorHandler();
        const { userData } = imsData;
        const formData = new FormData();
        const primarySkillsExperience = addCandidate.candidatePrimarySkills.map((item) => {
            return { skill: item, experience: 0 };
        });
        const secondarySkillsExperience = addCandidate.candidateSecondarySkills?.map((item) => {
            return { skill: item, experience: 0 };
        });
        const dataObject: any = {
            firstName: addCandidate.firstName,
            lastName: addCandidate.lastName,
            candidateStatus: addCandidate.candidateStatusCode,
            jobTitle: addCandidate.candidateJobTitle,
            jobId: addCandidate.jobId,
            projectName: addCandidate.projectName,
            buDetails: addCandidate.buDetails,
            taMember: addCandidate.taMember,
            priority: addCandidate.priority,
            contactNo: addCandidate.candidateContactNo,
            emailId: addCandidate.candidateEmailId,
            primarySkills: primarySkillsExperience,
            secondarySkills: secondarySkillsExperience,
            currentLocation: addCandidate.currentLocation,
            preferredWorkMode: addCandidate.preferredWorkMode,
            preferredLocation: addCandidate.preferredLocation,
            totalExperience: addCandidate.candidateTotalExperience,
            relevantExperience: addCandidate.relevantExperience,
            noticePeriod: addCandidate.candidateNoticePeriod,
            highestQualification: addCandidate.highestQualification,
            educationGapReason: addCandidate.educationGapReason,
            currentCtc: addCandidate.currentCtc,
            expectedCtc: addCandidate.expectedCtc,
            counterOfferDetails: addCandidate.counterOfferDetails,
            workTenureGapReason: addCandidate.workTenureGapReason,
            validEmploymentDocuments: addCandidate.validEmploymentDocuments,
            source: addCandidate.source,
            sourceName: addCandidate.sourceName,
            reasonForChange: addCandidate.reasonForChange,
            briefedAboutOrganization: addCandidate.briefedAboutOrganization,
            remark: addCandidate.remark,
        };
        if (!candidateData) {
            dataObject.employeeId = userData!.employeeID;
            dataObject.employeeName = userData!.name;
            dataObject.employeeEmailId = userData!.email;
        }

        formData.append('candidate', JSON.stringify(dataObject));

        formData.append('resumeFile', addCandidate.resumeFile);
        setLoading(true);
        try {
            setLoading(true);
            if (!candidateData) {
                await http.submit(RMS_API.CANDIDATE, formData);
                setLoading(false);
                resetForm();
                enqueueSnackbar(SUCCESS_ADD_CANDIDATE_MESSAGE + '\nDo you want to add more candidates ?', {
                    variant: 'success',
                    action: handleFormClose,
                    persist: true,
                    style: { whiteSpace: 'pre-line' },
                    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                });
            }
            if (candidateData) {
                await http
                    .update(`${RMS_API.CANDIDATE}/${candidateData.candidateId}`, formData)
                    .then(() => {
                        enqueueSnackbar('Candidate details updated successfully', {
                            variant: 'success',
                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                        });
                        resetForm();
                        navigate('/candidates');
                    })
                    .catch(() => enqueueSnackbar(FAILURE_POPUP.TEXT, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } }));
                setLoading(false);
            }
        } catch (err) {
            if (err.response.data.message.split('Reason: ')[1] == 'Candidate with the same Name,Email and Phone number already exists.') {
                enqueueSnackbar(err.response.data.message.split('Reason: ')[1], {
                    variant: 'error',
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                });
            }

            setViewMode(false);
            setLoading(false);
        }
    };
    useEffect(() => {
        if (addCandidate.preferredLocation !== '') {
            validate(PREFERRED_LOCATION, addCandidate.preferredLocation);
        }
    }, [addCandidate.preferredLocation]);

    const errorHandler = () => {
        checkCombinedValidation();

        validate(FIRST_NAME, addCandidate.firstName);

        validate(LAST_NAME, addCandidate.lastName);

        validate(CURRENT_CTC, addCandidate.currentCtc);

        validate(EXPECTED_CTC, addCandidate.expectedCtc);

        validate(PROJECT, addCandidate.projectName);

        validate(PRIORITY, addCandidate.priority);

        validate(TAMEMBER, addCandidate.taMember);

        validate(CANDIDATE_NOTICE_PERIOD, addCandidate.candidateNoticePeriod);

        validate(WORKINGMODE, addCandidate.preferredWorkMode);

        validate(LOCATION, addCandidate.preferredLocation);

        validate(PRIMARY_SKILLS, addCandidate.candidatePrimarySkills);

        validate(CONTACT_NO, addCandidate.candidateContactNo);

        validate(CURRENT_LOCATION, addCandidate.currentCtc);

        validate(EMAIL_ID, addCandidate.candidateEmailId);

        validate(TOTAL_EXPERIENCE_YEAR, addCandidate.candidateTotalExperienceYear);

        validate(TOTAL_EXPERIENCE_MONTH, addCandidate.candidateTotalExperienceMonth);

        validate(RELEVANT_EXPERIENCE_YEAR, addCandidate.candidateRelevantExperienceYear);

        validate(RELEVANT_EXPERIENCE_MONTH, addCandidate.candidateRelevantExperienceMonth);

        validate(HIGHEST_QUALIFICATION, addCandidate.highestQualification);

        validate(EDUCATION_GAP_REASON, addCandidate.educationGapReason);

        validate(COUNTER_OFFER_DETAILS, addCandidate.counterOfferDetails);

        validate(WORK_TENURE_GAP_REASON, addCandidate.workTenureGapReason);

        validate(VALID_EMPLOYMENT_DOCUMENTS, addCandidate.validEmploymentDocuments);

        validate(SOURCE, addCandidate.source);

        validate(SOURCE_NAME, addCandidate.sourceName);

        validate(REASON_FOR_CHANGE, addCandidate.reasonForChange);

        validate(ORGANIZATION_BRIEFING, addCandidate.briefedAboutOrganization);

        validate(REMARK, addCandidate.briefedAboutOrganization);

        validate(RESUME_FILE, addCandidate.resumeFileName);

        validate(CANDIDATE_JOB_TITLE, addCandidate.candidateJobTitle);

        if (
            addCandidate.candidateJobTitle &&
            addCandidate.firstName &&
            addCandidate.lastName &&
            addCandidate.preferredWorkMode &&
            addCandidate.preferredLocation &&
            addCandidate.candidatePrimarySkills &&
            addCandidate.candidateSecondarySkills &&
            addCandidate.candidateNoticePeriod.toString() &&
            addCandidate.source &&
            addCandidate.sourceName &&
            addCandidate.buDetails.name &&
            addCandidate.candidateEmailId &&
            addCandidate.candidateContactNo &&
            addCandidate.highestQualification &&
            addCandidate.remark &&
            addCandidate.reasonForChange &&
            addCandidate.candidateTotalExperienceYear.toString() &&
            addCandidate.candidateTotalExperienceMonth.toString() &&
            addCandidate.currentCtc.toString() &&
            addCandidate.expectedCtc.toString() &&
            addCandidate.candidateRelevantExperienceYear.toString() &&
            addCandidate.candidateRelevantExperienceMonth.toString() &&
            addCandidate.briefedAboutOrganization &&
            addCandidate.validEmploymentDocuments &&
            addCandidate.resumeFileName &&
            addCandidate.workTenureGapReason &&
            addCandidate.counterOfferDetails &&
            addCandidate.educationGapReason &&
            addCandidate.currentLocation &&
            !(
                errorValue.firstNameError.trim() == '' &&
                errorValue.lastNameError.trim() === '' &&
                errorValue.currentCtcError.trim() === '' &&
                errorValue.expectedCtcError.trim() === '' &&
                errorValue.candidateNoticePeriodError.trim() === '' &&
                errorValue.priorityError.trim() == '' &&
                errorValue.preferredLocationError.trim() === '' &&
                errorValue.preferredWorkModeError.trim() === '' &&
                errorValue.relevantCombinedError.trim() === '' &&
                errorValue.taMemberError.trim() === '' &&
                errorValue.candidatePrimarySkillsError.trim() === '' &&
                errorValue.candidateContactNoError.trim() === '' &&
                errorValue.currentLocationError.trim() === '' &&
                errorValue.candidateEmailIdError.trim() === '' &&
                errorValue.candidateTotalExperienceYearError === '' &&
                errorValue.candidateTotalExperienceMonthError === '' &&
                errorValue.candidateRelevantExperienceYearError === '' &&
                errorValue.candidateRelevantExperienceMonthError === '' &&
                errorValue.highestQualificationError === '' &&
                errorValue.educationGapReasonError === '' &&
                errorValue.counterOfferDetailsError === '' &&
                errorValue.workTenureGapReasonError === '' &&
                errorValue.validEmploymentDocumentsError === '' &&
                errorValue.candidateProfileSourceError === '' &&
                errorValue.candidateProfileSourceNameError === '' &&
                errorValue.reasonForChangeError === '' &&
                errorValue.briefedAboutOrganizationError === '' &&
                errorValue.remarkError === '' &&
                errorValue.resumeFileNameError &&
                errorValue.candidateJobTitleError === ''
            )
        ) {
            setViewMode(true);
            setDisable(false);
        }
        setDisable(true);
    };

    return (
        <>
            <div className='referral-form'>
                <div className='static-heading'>
                    <Box className='referral-title-container'>
                        <span>
                            <ArrowBack onClick={() => navigate('/candidates')} cursor='pointer' fontSize='large' />
                        </span>
                        <Typography variant='h4' className='title'>
                            Add Candidate
                        </Typography>
                    </Box>
                </div>

                <div className='side-nav'>
                    <ToggleButtonGroup
                        className='side-nav'
                        orientation='vertical'
                        value={details}
                        exclusive
                        onChange={handleClick}
                        color='primary'
                        aria-label='Platform'>
                        {detailButtons.map((detail, index) => {
                            return (
                                <ToggleButton value={detail.code} key={index}>
                                    {detail.label}
                                </ToggleButton>
                            );
                        })}
                    </ToggleButtonGroup>
                </div>
                <div ref={reqRef}></div>
                <Grid
                    container
                    spacing={3}
                    style={{ marginLeft: '300px', marginTop: '10px', width: '65%' }}
                    columns={8}
                    alignItems='flex-end'
                    justifyContent='flex-start'>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end' style={{ marginTop: '30px' }}>
                        <Autocomplete
                            options={apiValue.jobArray}
                            disabled={viewMode}
                            disableClearable
                            getOptionLabel={(option: any) => (typeof option === 'string' ? option : option.jobTitle)}
                            onChange={(event: any, newValue: any) => {
                                setAddCandidate({
                                    ...addCandidate,

                                    candidateJobTitle: newValue.jobTitle,

                                    projectName: newValue?.projectName,

                                    jobId: newValue?.id,

                                    buDetails: newValue?.buDetails,

                                    taMember: newValue?.taMember,

                                    priority: newValue?.priority,

                                    job_display_Id: newValue?.jobId,
                                });

                                validate('candidateJobTitle', newValue ? newValue : '');
                            }}
                            value={addCandidate.candidateJobTitle}
                            renderInput={(params: any) => (
                                <TextField
                                    {...params}
                                    required
                                    variant='outlined'
                                    size='small'
                                    onBlur={(e) => {
                                        const { name, value } = e.target;

                                        validate(name, value);
                                    }}
                                    type='text'
                                    name='candidateJobTitle'
                                    value={addCandidate.candidateJobTitle}
                                    label='Position Name'
                                    error={errorValue.candidateJobTitleError?.length > 0 || errorValue.candidateJobTitleError}
                                    helperText={errorValue.candidateJobTitleError ? errorValue.candidateJobTitleError : ' '}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            required
                            disabled={viewMode}
                            fullWidth
                            variant='outlined'
                            size='small'
                            InputProps={{
                                readOnly: true,
                            }}
                            name='jobId'
                            value={addCandidate.job_display_Id}
                            placeholder='Req.No'
                            label='Requirment No'
                            helperText={errorValue.jobIdError ? errorValue.jobIdError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            fullWidth
                            InputProps={{
                                readOnly: true,
                            }}
                            name='projectName'
                            placeholder='Project'
                            label='Project'
                            value={addCandidate.projectName}
                            helperText={errorValue.projectNameError ? errorValue.projectNameError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            InputProps={{
                                readOnly: true,
                            }}
                            name='buDetails'
                            fullWidth
                            placeholder='BU Head Name'
                            label='BU Head'
                            value={addCandidate.buDetails.name}
                            helperText={errorValue.taMemberError ? errorValue.taMemberError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <Autocomplete
                            disabled={viewMode}
                            multiple
                            options={addCandidate.taMember.map((value: any) => value.name)}
                            value={addCandidate.taMember.map((value: any) => value.name)}
                            renderTags={(value) => value.map((option, index) => <Chip key={index} label={option} />)}
                            renderInput={(params) => (
                                <TextField {...params} variant='outlined' size='small' label='TA Member' placeholder='TA Member' />
                            )}
                        />
                    </Grid>

                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            InputProps={{
                                readOnly: true,
                            }}
                            name='priority'
                            placeholder='Priority'
                            label='Priority'
                            value={addCandidate.priority}
                        />
                    </Grid>

                    <div ref={personalDetailsRef}></div>
                    <div className='hr'></div>

                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            inputProps={{
                                maxLength: 255,
                            }}
                            name='firstName'
                            fullWidth
                            placeholder='First Name'
                            label='First Name'
                            value={addCandidate.firstName}
                            onChange={handleChange}
                            onBlur={handleChange}
                            error={errorValue.firstNameError.length > 0}
                            helperText={errorValue.firstNameError ? errorValue.firstNameError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' maxHeight='2%' alignItems='flex-end'>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            name='lastName'
                            placeholder='Last Name'
                            onBlur={handleChange}
                            label='Last Name'
                            value={addCandidate.lastName}
                            onChange={handleChange}
                            error={errorValue.lastNameError.length > 0}
                            helperText={errorValue.lastNameError ? errorValue.lastNameError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <MuiTelInput
                            required
                            fullWidth
                            size='small'
                            inputProps={{
                                style: {
                                    height: '25px',
                                },
                            }}
                            name='contactNo'
                            onlyCountries={['IN']}
                            defaultCountry='IN'
                            forceCallingCode
                            onChange={phoneHandleChange}
                            onBlur={(e) => {
                                if (e.target.name === 'contactNo') {
                                    phoneHandleChange('+91 ' + e.target.value);
                                }
                            }}
                            value={addCandidate.candidateContactNo}
                            variant='outlined'
                            label='Contact No'
                            placeholder='Enter Contact No'
                            error={errorValue.candidateContactNoError.length > 0}
                            helperText={errorValue.candidateContactNoError ? errorValue.candidateContactNoError : ' '}
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            name='candidateEmailId'
                            value={addCandidate.candidateEmailId}
                            onChange={handleChange}
                            onBlur={handleChange}
                            placeholder='Email'
                            label='Email'
                            error={errorValue.candidateEmailIdError.length > 0}
                            helperText={errorValue.candidateEmailIdError ? errorValue.candidateEmailIdError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <Autocomplete
                            multiple
                            freeSolo
                            fullWidth
                            options={skills}
                            disabled={viewMode}
                            getOptionLabel={(option: any) => option}
                            value={addCandidate.candidatePrimarySkills}
                            getOptionDisabled={(option: any) => {
                                return addCandidate.candidateSecondarySkills.indexOf(option) !== -1;
                            }}
                            onBlur={checkSkills}
                            onChange={(event: any, value: any) => {
                                setAddCandidate({
                                    ...addCandidate,
                                    candidatePrimarySkills: value,
                                });

                                validate('candidatePrimarySkills', value ? value : ' ');
                            }}
                            renderInput={(params: any) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    required
                                    variant='outlined'
                                    size='small'
                                    type='text'
                                    placeholder='Primary Skills'
                                    label='Primary Skills'
                                    error={errorValue.candidatePrimarySkillsError.length > 0}
                                    helperText={errorValue.candidatePrimarySkillsError ? errorValue.candidatePrimarySkillsError : ' '}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={4} md={4} justifyContent='flex-end' width='10%' alignItems='flex-end'>
                        <Autocomplete
                            multiple
                            freeSolo
                            disabled={viewMode}
                            options={skills}
                            getOptionLabel={(option: any) => option}
                            value={addCandidate.candidateSecondarySkills}
                            getOptionDisabled={(option: any) => {
                                return addCandidate.candidatePrimarySkills.indexOf(option) !== -1;
                            }}
                            onChange={(event: any, newValue: any) => {
                                setAddCandidate({
                                    ...addCandidate,
                                    candidateSecondarySkills: newValue,
                                });
                            }}
                            renderInput={(params: any) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    variant='outlined'
                                    size='small'
                                    type='text'
                                    style={{ marginBottom: '20px' }}
                                    name='candidateSecondarySkills'
                                    placeholder='Secondary Skills'
                                    label='Secondary Skills'
                                    helperText={errorValue.candidateSecondarySkillsError ? errorValue.candidateSecondarySkillsError : ' '}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            required
                            fullWidth
                            variant='outlined'
                            size='small'
                            type='text'
                            name='currentLocation'
                            placeholder='Current Locatiom'
                            label='Current Location'
                            onBlur={handleChange}
                            onChange={handleChange}
                            disabled={viewMode}
                            value={addCandidate.currentLocation}
                            error={errorValue.currentLocationError.length > 0}
                            helperText={errorValue.currentLocationError ? errorValue.currentLocationError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <Autocomplete
                            disabled={viewMode}
                            id='standard-number'
                            options={apiValue.locationArray}
                            getOptionLabel={(option: any) => (typeof option === 'object' ? option.mode : option)}
                            onChange={(event: any, newValue: any) => {
                                setLocationAccess(false);
                                setAddCandidate({
                                    ...addCandidate,
                                    preferredWorkMode: newValue.mode,

                                    preferredLocation: '',
                                });
                                validate('mode', newValue ? newValue : '');
                                if (newValue == null) {
                                    setLocationAccess(true);
                                    errorValue.preferredLocationError = '';
                                    setAddCandidate({
                                        ...addCandidate,
                                        preferredLocation: '',
                                        preferredWorkMode: '',
                                    });
                                    setLocation([]);
                                }

                                if (newValue !== null && newValue.mode === 'WF-Home') {
                                    setLocationAccess(false);
                                    setAddCandidate({
                                        ...addCandidate,
                                        preferredLocation: 'NA',
                                        preferredWorkMode: newValue.mode,
                                    });
                                }
                                setLocation(newValue !== null ? newValue.workLocation : '');
                            }}
                            value={addCandidate.preferredWorkMode}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label='Work Mode'
                                    fullWidth
                                    size='small'
                                    variant='outlined'
                                    placeholder='Work Mode'
                                    name='mode'
                                    onBlur={(e) => {
                                        const { name, value } = e.target;

                                        validate(name, value);
                                    }}
                                    error={errorValue.preferredWorkModeError.length > 0}
                                    helperText={errorValue.preferredWorkModeError ? errorValue.preferredWorkModeError : ' '}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <Autocomplete
                            disabled={locationAccess || viewMode}
                            options={locationOptions}
                            getOptionLabel={(option: any) => (option ? option : '')}
                            onChange={(event: any, newValue: any) => {
                                setAddCandidate({
                                    ...addCandidate,
                                    preferredLocation: newValue,
                                });
                                validate('location', newValue ? newValue : '');
                            }}
                            value={addCandidate.preferredLocation}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label='Location'
                                    size='small'
                                    fullWidth
                                    variant='outlined'
                                    placeholder='Location'
                                    name='location'
                                    onBlur={(e) => {
                                        const { name, value } = e.target;
                                        validate(name, value);
                                    }}
                                    error={errorValue.preferredLocationError.length > 0}
                                    helperText={errorValue.preferredLocationError}
                                />
                            )}
                        />
                    </Grid>

                    <div ref={experienceAndEducationRef}></div>
                    <div className='hr'></div>

                    <Grid item xs={4}>
                        <TextField
                            required
                            disabled={viewMode}
                            variant='outlined'
                            fullWidth
                            size='small'
                            type='number'
                            inputProps={{ min: 0, max: 60 }}
                            onChange={handleChange}
                            // eslint-disable-next-line max-len
                            value={
                                candidateData
                                    ? addCandidate.candidateTotalExperienceYear === 0
                                        ? '0'
                                        : addCandidate.candidateTotalExperienceYear
                                    : addCandidate.candidateTotalExperienceYear === 0
                                    ? ''
                                    : addCandidate.candidateTotalExperienceYear
                            }
                            name='candidateTotalExperienceYear'
                            placeholder='Years'
                            label='Total Exp.Years'
                            onBlur={handleChange}
                            error={errorValue.candidateTotalExperienceYearError?.length > 0}
                            helperText={errorValue.candidateTotalExperienceYearError ? errorValue.candidateTotalExperienceYearError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            required
                            disabled={viewMode}
                            fullWidth
                            inputProps={{ min: 0, max: 11 }}
                            variant='outlined'
                            size='small'
                            type='number'
                            onChange={handleChange}
                            // eslint-disable-next-line max-len
                            value={
                                candidateData
                                    ? addCandidate.candidateTotalExperienceMonth === 0
                                        ? '0'
                                        : addCandidate.candidateTotalExperienceMonth
                                    : addCandidate.candidateTotalExperienceMonth === 0
                                    ? ''
                                    : addCandidate.candidateTotalExperienceMonth
                            }
                            name='candidateTotalExperienceMonth'
                            placeholder='Month'
                            label='Total Exp.Months'
                            onBlur={handleChange}
                            error={errorValue.candidateTotalExperienceMonthError.length > 0}
                            helperText={errorValue.candidateTotalExperienceMonthError ? errorValue.candidateTotalExperienceMonthError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            required
                            disabled={viewMode}
                            fullWidth
                            variant='outlined'
                            size='small'
                            type='number'
                            inputProps={{ min: 0, max: 60 }}
                            onChange={handleChange}
                            // eslint-disable-next-line max-len
                            value={
                                candidateData
                                    ? addCandidate.candidateRelevantExperienceYear === 0
                                        ? '0'
                                        : addCandidate.candidateRelevantExperienceYear
                                    : addCandidate.candidateRelevantExperienceYear === 0
                                    ? ''
                                    : addCandidate.candidateRelevantExperienceYear
                            }
                            name='candidateRelevantExperienceYear'
                            placeholder='Year'
                            label='Relevant Exp.Years'
                            onBlur={handleChange}
                            error={errorValue.candidateRelevantExperienceYearError.length > 0}
                            helperText={errorValue.candidateRelevantExperienceYearError ? errorValue.candidateRelevantExperienceYearError : ' '}
                        />
                        {errorValue.relevantCombinedError && <span className='relevant-exp-err'>{errorValue.relevantCombinedError}</span>}
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            required
                            disabled={viewMode}
                            fullWidth
                            variant='outlined'
                            size='small'
                            type='number'
                            onChange={handleChange}
                            // eslint-disable-next-line max-len
                            value={
                                candidateData
                                    ? addCandidate.candidateRelevantExperienceMonth === 0
                                        ? '0'
                                        : addCandidate.candidateRelevantExperienceMonth
                                    : addCandidate.candidateRelevantExperienceMonth === 0
                                    ? ''
                                    : addCandidate.candidateRelevantExperienceMonth
                            }
                            name='candidateRelevantExperienceMonth'
                            placeholder='Month'
                            label='Relevant Exp.Months'
                            inputProps={{ min: 0, max: 11 }}
                            onBlur={handleChange}
                            error={errorValue.candidateRelevantExperienceMonthError.length > 0}
                            helperText={errorValue.candidateRelevantExperienceMonthError ? errorValue.candidateRelevantExperienceMonthError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            required
                            fullWidth
                            variant='outlined'
                            size='small'
                            type='number'
                            onChange={handleChange}
                            disabled={viewMode}
                            // eslint-disable-next-line max-len
                            value={
                                candidateData
                                    ? addCandidate.candidateNoticePeriod === 0
                                        ? '0'
                                        : addCandidate.candidateNoticePeriod
                                    : addCandidate.candidateNoticePeriod === 0
                                    ? ''
                                    : addCandidate.candidateNoticePeriod
                            }
                            name='candidateNoticePeriod'
                            placeholder='Notice Period'
                            label='Notice Period'
                            onBlur={handleChange}
                            error={errorValue.candidateNoticePeriodError.length > 0}
                            helperText={errorValue.candidateNoticePeriodError ? errorValue.candidateNoticePeriodError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            variant='outlined'
                            size='small'
                            type='text'
                            name='highestQualification'
                            onChange={handleChange}
                            value={addCandidate.highestQualification}
                            placeholder='Highest Qualification'
                            label='Highest Qualification'
                            onBlur={handleChange}
                            disabled={viewMode}
                            error={errorValue.highestQualificationError.length > 0}
                            helperText={errorValue.highestQualificationError ? errorValue.highestQualificationError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            disabled={viewMode}
                            required
                            variant='outlined'
                            size='small'
                            type='text'
                            name='educationGapReason'
                            placeholder='Education Gap & Reason'
                            label='Education Gap & Reason'
                            onChange={handleChange}
                            onBlur={handleChange}
                            value={addCandidate.educationGapReason}
                            error={errorValue.educationGapReasonError.length > 0}
                            helperText={errorValue.educationGapReasonError ? errorValue.educationGapReasonError : ' '}
                        />
                    </Grid>

                    <div ref={ctcAndCounterOfferRef}></div>

                    <div className='hr'></div>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            disabled={viewMode}
                            required
                            variant='outlined'
                            size='small'
                            type='number'
                            value={
                                candidateData
                                    ? addCandidate.currentCtc === 0
                                        ? '0'
                                        : addCandidate.currentCtc
                                    : addCandidate.currentCtc === 0
                                    ? ''
                                    : addCandidate.currentCtc
                            }
                            onChange={handleChange}
                            name='currentCtc'
                            placeholder='Current CTC'
                            label='Current CTC'
                            onBlur={handleChange}
                            error={errorValue.currentCtcError.length > 0}
                            helperText={errorValue.currentCtcError ? errorValue.currentCtcError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='number'
                            onChange={handleChange}
                            name='expectedCtc'
                            placeholder='Expected CTC'
                            value={
                                candidateData
                                    ? addCandidate.expectedCtc === 0
                                        ? '0'
                                        : addCandidate.expectedCtc
                                    : addCandidate.expectedCtc === 0
                                    ? ''
                                    : addCandidate.expectedCtc
                            }
                            label='Expected CTC'
                            error={errorValue.expectedCtcError.length > 0}
                            helperText={errorValue.expectedCtcError ? errorValue.expectedCtcError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            required
                            fullWidth
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            onChange={handleChange}
                            onBlur={handleChange}
                            value={addCandidate.counterOfferDetails}
                            name='counterOfferDetails'
                            placeholder='Counter Offer & details'
                            label='Counter Offer & Details'
                            error={errorValue.counterOfferDetailsError.length > 0}
                            helperText={errorValue.counterOfferDetailsError ? errorValue.counterOfferDetailsError : ' '}
                        />
                    </Grid>

                    <div ref={otherDetailsRef}></div>
                    <div className='hr'></div>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            onChange={handleChange}
                            value={addCandidate.workTenureGapReason}
                            name='workTenureGapReason'
                            placeholder='Work Tenure Gap & Reason'
                            label='Work Tenure & Gap Reason'
                            onBlur={handleChange}
                            error={errorValue.workTenureGapReasonError.length > 0}
                            helperText={errorValue.workTenureGapReasonError ? errorValue.workTenureGapReasonError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            onChange={handleChange}
                            value={addCandidate.validEmploymentDocuments}
                            name='validEmploymentDocuments'
                            placeholder='Valid Employment Documents'
                            label='Valid Employement Documents'
                            onBlur={handleChange}
                            error={errorValue.validEmploymentDocumentsError.length > 0}
                            helperText={errorValue.validEmploymentDocumentsError ? errorValue.validEmploymentDocumentsError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <Autocomplete
                            fullWidth
                            disabled={viewMode}
                            disableClearable
                            options={apiValue.sourceArray}
                            getOptionLabel={(option: any) => (typeof option === 'object' ? option.name : option)}
                            value={addCandidate.source}
                            onChange={(event: any, newValue: any) => {
                                setAddCandidate({
                                    ...addCandidate,
                                    source: newValue?.name,
                                });

                                validate('source', newValue.name ? newValue.name : ' ');
                            }}
                            renderInput={(params: any) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    required
                                    variant='outlined'
                                    size='small'
                                    type='text'
                                    name='source'
                                    placeholder='Profile Source'
                                    label=' Profile Source'
                                    onBlur={(e) => {
                                        const { name, value } = e.target;
                                        validate(name, value);
                                    }}
                                    error={errorValue.candidateProfileSourceError.length > 0}
                                    helperText={errorValue.candidateProfileSourceError ? errorValue.candidateProfileSourceError : ' '}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            onBlur={handleChange}
                            value={addCandidate.sourceName}
                            name='sourceName'
                            placeholder='Source Name'
                            label='Source Name'
                            onChange={handleChange}
                            error={errorValue.candidateProfileSourceNameError.length > 0}
                            helperText={errorValue.candidateProfileSourceNameError ? errorValue.candidateProfileSourceNameError : ' '}
                        />
                    </Grid>

                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            type='text'
                            onChange={handleChange}
                            onBlur={handleChange}
                            value={addCandidate.reasonForChange}
                            name='reasonForChange'
                            placeholder='Reason for change'
                            label='Reason for Change'
                            error={errorValue.reasonForChangeError.length > 0}
                            helperText={errorValue.reasonForChangeError ? errorValue.reasonForChangeError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            onChange={handleChange}
                            onBlur={handleChange}
                            value={addCandidate.briefedAboutOrganization}
                            type='text'
                            name='briefedAboutOrganization'
                            placeholder='Briefed about organization'
                            label='Briefed about organization'
                            error={errorValue.briefedAboutOrganizationError.length > 0}
                            helperText={errorValue.briefedAboutOrganizationError ? errorValue.briefedAboutOrganizationError : ' '}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            fullWidth
                            required
                            disabled={viewMode}
                            variant='outlined'
                            size='small'
                            onChange={handleChange}
                            onBlur={handleChange}
                            value={addCandidate.remark}
                            type='text'
                            name='remark'
                            placeholder='Remark (if any)'
                            label='Remark'
                            error={errorValue.remarkError.length > 0}
                            helperText={errorValue.remarkError ? errorValue.remarkError : ' '}
                        />
                    </Grid>
                </Grid>

                <Grid item xs={4}>
                    <div className='row justify-content-space-evenly mt-3'>
                        <div className='col-lg-4 ' style={{ marginLeft: '330px' }}>
                            <p className='resume-label'>Attach Resume (format .pdf, .docx, .doc, .rtf, .txt)</p>

                            <label>
                                <input
                                    required
                                    className='resume-file-style'
                                    disabled={viewMode}
                                    onClick={(e) => {
                                        document.body.onfocus = (e) => {
                                            if (addCandidate.resumeFileName) {
                                                return;
                                            } else {
                                                validateFile('resumeFile', '');
                                            }
                                            document.body.onfocus = null;
                                        };
                                    }}
                                    id='standard-required'
                                    type='file'
                                    onChange={onFileChange}
                                    name='resumeFileName'
                                    ref={fileInput!}
                                    accept={ACCEPTED_FILES}
                                />

                                <span className='resume-input-field'>
                                    <FontAwesomeIcon size='lg' icon={faFileUpload} style={{ marginRight: '1rem' }} />
                                    <u style={{ color: '#0085ff' }}>Upload Resume</u>
                                </span>
                            </label>

                            {addCandidate.resumeFileName && (
                                <span>{!viewMode && <FontAwesomeIcon className='ml-3' onClick={fileDeleteHandler} size='sm' icon={faTrash} />}</span>
                            )}
                            <p className='resume-file-name'>{addCandidate.resumeFileName}</p>

                            {errorValue.resumeFileNameError.length > 0 && (
                                <p className='text-danger' id='resumeFileNameError'>
                                    {errorValue.resumeFileNameError ? errorValue.resumeFileNameError : ' '}
                                </p>
                            )}
                        </div>
                    </div>
                </Grid>

                {viewMode ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '18px', paddingTop: '10px', marginBottom: '60px' }}>
                        <Button
                            color='primary'
                            style={{ height: '48px', width: '130px', marginBottom: '20px' }}
                            className='secondary-btn mt-5'
                            onClick={() => {
                                setViewMode(false);
                                setDisable(false);
                            }}
                            type='reset'>
                            Back
                        </Button>
                        <Button
                            type='button'
                            onClick={submitData}
                            color='primary'
                            variant='contained'
                            style={{ height: '48px', width: '130px', marginBottom: '20px' }}
                            className='primary-btn mt-5'>
                            Confirm
                        </Button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '20px', paddingBottom: '15px', marginLeft: '20px' }}>
                        <Button
                            color='primary'
                            className='secondary-btn mt-5'
                            onClick={() =>
                                enqueueSnackbar(CANCEL_NEW_REQ_POPUP_TEXT, {
                                    action: (key: any) => clearFormData(Number(key)),
                                    variant: 'warning',
                                    persist: true,
                                    className: 'warn',
                                    style: { whiteSpace: 'pre-line' },
                                    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                                })
                            }
                            style={{ height: '48px', width: '130px' }}
                            type='reset'>
                            Clear
                        </Button>
                        <Button
                            type='button'
                            onClick={() => {
                                errorHandler();
                            }}
                            className={disable ? 'disabled-btn mt-5 ' : 'primary-btn mt-5'}
                            color='primary'
                            variant='contained'
                            style={{ height: '48px', width: '130px' }}
                            disabled={disable}>
                            Submit
                        </Button>
                    </div>
                )}
            </div>
            {loading && <ImsLoader showLoader={true} />}
        </>
    );
}

export default addCandidate;
