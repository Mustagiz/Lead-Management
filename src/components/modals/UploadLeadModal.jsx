import React, { useState, useEffect } from 'react';
import { Upload, Download, X, CheckCircle2, Target, Building2, Globe, ClipboardCheck, Sparkles, RefreshCw } from 'lucide-react';
import { enrichLead } from '../../services/enrichmentService';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Select, Card } from '../common/UIComponents';

const UploadLeadModal = ({ onClose, onSuccess, employeeId, employeeName, leadToEdit }) => {
    const { currentUser } = useAuth();
    const [uploadType, setUploadType] = useState('single');
    const [formData, setFormData] = useState(
        leadToEdit ? { ...leadToEdit } : {
            campaign: '',
            company_name: '',
            salutation: 'Mr.',
            first_name: '',
            last_name: '',
            email: '',
            domain: '',
            job_title: '',
            department: 'Marketing',
            job_level: 'Mid-level',
            job_title_link: '',
            phone_no: '',
            direct_dial: '',
            address1: '',
            city: '',
            state: '',
            zip_code: '',
            country: 'United States',
            industry_type: 'Technology',
            industry_type_link: '',
            employee_size: '1-10',
            employee_size_link: '',
            associated_members: '',
            revenue_size: '',
            revenue_size_link: '',
            tenure: '',
            vv_status: 'RPC Verified',
            ra_comments: '',
            custom_question_responses: {}
        }
    );
    const [csvFile, setCsvFile] = useState(null);
    const [selectedBulkCampaign, setSelectedBulkCampaign] = useState('');
    const [errors, setErrors] = useState({});
    const [campaigns, setCampaigns] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [updateExistingLeads, setUpdateExistingLeads] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);

    const departments = ['HR', 'Finance', 'Marketing', 'Sales', 'IT', 'Operations', 'R&D', 'Customer Service', 'Legal', 'Supply Chain', 'Logistics', 'Administration', 'QA/QC', 'Engineering', 'Security', 'PMO', 'Corporate Strategy', 'PR', 'Facilities Management', 'Data Analytics'];
    const jobLevels = ['Entry-level', 'Junior', 'Mid-level', 'Senior', 'Principal', 'Executive', 'C-Suite'];
    const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'China', 'Japan', 'Brazil'];
    const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Energy', 'Transportation', 'Media'];
    const employeeSizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10,000+'];
    const vvStatusOptions = ['RPC Verified', 'RPC Voice Mail', 'Dail by Name', 'Operator Verified', 'Company Verified'];

    useEffect(() => {
        const fetchCampaigns = async () => {
            const { data: activeCampaigns, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('is_active', true);
            if (!error) {
                setCampaigns(activeCampaigns);
            }
        };
        fetchCampaigns();
    }, []);

    const checkDuplicateEmail = async (email, campaign) => {
        if (!email || !campaign || !validateEmail(email)) return;

        const { data, error } = await supabase
            .from('leads')
            .select('id')
            .eq('email', email)
            .eq('campaign', campaign)
            .limit(1);

        if (data && data.length > 0) {
            setErrors(prev => ({
                ...prev,
                email: `This email already exists in campaign "${campaign}". Duplicate leads in the same campaign are not allowed.`
            }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors.email && newErrors.email.includes('already exists')) {
                    delete newErrors.email;
                }
                return newErrors;
            });
        }
    };

    useEffect(() => {
        if (uploadType !== 'single' || leadToEdit) return;

        const timer = setTimeout(() => {
            if (formData.email && formData.campaign) {
                checkDuplicateEmail(formData.email, formData.campaign);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.email, formData.campaign, uploadType]);

    const FREE_EMAIL_DOMAINS = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
        'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
        'mail.com', 'yandex.com', 'gmx.com', 'zoho.com', 'rediffmail.com',
        'inbox.com', 'fastmail.com', 'tutanota.com', 'hushmail.com',
        'yahoo.co.in', 'yahoo.co.uk', 'hotmail.co.uk', 'hotmail.in'
    ];

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isProfessionalEmail = (email) => {
        if (!validateEmail(email)) return false;
        const domain = email.split('@')[1]?.toLowerCase();
        return !FREE_EMAIL_DOMAINS.includes(domain);
    };

    const validatePhone = (phone) => {
        if (!phone) return true;
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
    };

    const handleEnrich = async () => {
        if (!formData.company_name) {
            alert('Please enter a company name first.');
            return;
        }

        setIsEnriching(true);
        try {
            const enrichedData = await enrichLead(formData.company_name, formData.country);
            if (enrichedData) {
                setFormData(prev => ({
                    ...prev,
                    linkedin_url: enrichedData.linkedin_url || prev.linkedin_url,
                    revenue_size: enrichedData.revenue_range || prev.revenue_size,
                    custom_question_responses: {
                        ...prev.custom_question_responses,
                        enrichment_contacts: JSON.stringify(enrichedData.key_contacts || [])
                    }
                }));
            } else {
                alert('No enrichment data found or AI API Key missing.');
            }
        } catch (error) {
            console.error('Enrichment error:', error);
        } finally {
            setIsEnriching(false);
        }
    };

    const handleSingleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.email || !validateEmail(formData.email)) {
            newErrors.email = 'Valid email is required';
        }
        if (formData.phone_no && !validatePhone(formData.phone_no)) {
            newErrors.phone_no = 'Invalid phone format';
        }
        if (formData.direct_dial && !validatePhone(formData.direct_dial)) {
            newErrors.direct_dial = 'Invalid phone format';
        }
        if (!formData.company_name) newErrors.company_name = 'Company name is required';
        if (!formData.first_name) newErrors.first_name = 'First name is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = async () => {
            // Professional email check
            if (formData.email && !isProfessionalEmail(formData.email)) {
                setErrors(prev => ({ ...prev, email: 'Please use a professional/corporate email address (no Gmail, Yahoo, etc.)' }));
                return;
            }

            // Campaign-specific duplicate check
            if (!leadToEdit) {
                const { data: existingLeads } = await supabase
                    .from('leads')
                    .select('id, company_name, campaign')
                    .eq('email', formData.email)
                    .eq('campaign', formData.campaign);

                if (existingLeads && existingLeads.length > 0) {
                    setErrors(prev => ({ ...prev, email: `This email already exists in campaign "${formData.campaign}". Duplicate leads in the same campaign are not allowed.` }));
                    return;
                }
            } else if (leadToEdit.email !== formData.email) {
                const { data: existingLeads } = await supabase
                    .from('leads')
                    .select('id, company_name, campaign')
                    .eq('email', formData.email)
                    .eq('campaign', leadToEdit.campaign);

                if (existingLeads && existingLeads.length > 0) {
                    setErrors(prev => ({ ...prev, email: `This email already exists in campaign "${leadToEdit.campaign}".` }));
                    return;
                }
            }

            if (leadToEdit) {
                const { error } = await supabase
                    .from('leads')
                    .update(formData)
                    .eq('id', leadToEdit.id);
                if (error) {
                    alert('Error updating lead: ' + error.message);
                    return;
                }
                // Manual audit log removed as it's now handled by the database trigger
            } else {
                const { error } = await supabase
                    .from('leads')
                    .insert([{ ...formData, employee_id: employeeId, ra_name: employeeName, status: 'pending' }]);
                if (error) {
                    alert('Error creating lead: ' + error.message);
                    return;
                }
            }
            onSuccess();
            onClose();
        };

        submitData();
    };

    const downloadTemplate = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            const standardHeaders = [
                'Date', 'RA Name', 'Campaign', 'Company', 'Salutation', 'First Name', 'Last Name',
                'Email', 'Domain', 'Job Title', 'Department', 'Job Level',
                'Job Title Link', 'Phone', 'Direct Dial', 'Address', 'City',
                'State', 'Zip', 'Country', 'Industry', 'Industry Link',
                'Employee Size', 'Associated Members', 'Employee Size Link', 'Revenue Size',
                'Revenue Size Link', 'Tenure', 'VV Status', 'RA Comments'
            ];

            let headers = [...standardHeaders];

            if (selectedBulkCampaign) {
                const campaignObj = campaigns.find(c => c.name === selectedBulkCampaign);
                if (campaignObj && campaignObj.custom_questions) {
                    campaignObj.custom_questions.forEach(q => headers.push(q.question));
                }
            } else {
                const allCustomQuestions = new Set();
                campaigns.forEach(c => {
                    if (c.is_active && c.custom_questions) {
                        c.custom_questions.forEach(q => allCustomQuestions.add(q.question));
                    }
                });
                headers = [...headers, ...Array.from(allCustomQuestions)];
            }

            const csvContent = headers.join(",") + "\n";
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.style.display = 'none';
            link.href = url;
            link.setAttribute("download", selectedBulkCampaign ? `template_${selectedBulkCampaign.replace(/\s+/g, '_')}.csv` : "lead_upload_template.csv");
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Template download error:', err);
            alert('Failed to generate template. Please try again.');
        }
    };

    const parseCSV = (text) => {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;

        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentCell += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentCell += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    currentRow.push(currentCell.trim());
                    currentCell = '';
                } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                    currentRow.push(currentCell.trim());
                    if (currentRow.some(c => c)) rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                    if (char === '\r') i++;
                } else if (char === '\r') {
                    currentRow.push(currentCell.trim());
                    if (currentRow.some(c => c)) rows.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
        }

        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c)) rows.push(currentRow);
        }

        return rows;
    };

    const handleBulkUpload = (e) => {
        e.preventDefault();
        if (!csvFile) {
            alert('Please select a CSV file');
            return;
        }
        if (!selectedBulkCampaign) {
            alert('Please select a campaign for bulk upload');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            let text = event.target.result;
            const rows = parseCSV(text);

            if (rows.length < 2) {
                alert('The CSV file appears to be empty or only contains headers.');
                return;
            }

            const processRows = async () => {
                const rawHeaders = rows[0];
                const headers = rawHeaders.map(h => h.trim().toLowerCase());
                const headerMap = headers.reduce((acc, curr, index) => {
                    if (curr) acc[curr.toLowerCase().trim()] = index;
                    return acc;
                }, {});

                if (!headerMap['company name'] && !headerMap['company']) {
                    alert(`Mandatory header 'Company Name' or 'Company' not found.`);
                    return;
                }

                const COL_ALIASES = {
                    'company_name': ['company name', 'company', 'organization', 'business name', 'client'],
                    'first_name': ['first name', 'first', 'fname', 'contact person', 'contact name', 'contact', 'name'],
                    'last_name': ['last name', 'last', 'lname', 'surname'],
                    'email': ['email', 'email address', 'e-mail', 'mail', 'contact email', 'email id'],
                    'job_title': ['job title', 'job', 'title', 'position', 'designation', 'role', 'occupation'],
                    'phone_no': ['phone no', 'phone', 'mobile', 'cell', 'contact number', 'telephone', 'phone number'],
                    'address1': ['address 1', 'address', 'street', 'location', 'address line 1'],
                    'zip_code': ['zip code', 'zip', 'postal code', 'pincode', 'postcode'],
                    'employee_size': ['employee size', 'employees', 'staff size', 'company size', 'no of employees'],
                    'revenue_size': ['revenue size', 'revenue', 'turnover', 'annual revenue', 'annual turnover'],
                    'industry_type': ['industry type', 'industry', 'sector', 'domain', 'vertical'],
                    'city': ['city', 'town', 'location', 'municipality'],
                    'state': ['state', 'province', 'region', 'district'],
                    'country': ['country', 'nation', 'region'],
                    'linkedin_profile': ['linkedin', 'linkedin profile', 'linkedin url', 'profile url', 'url'],
                    'id': ['id', 'lead id', 'lead_id', 'record id'],
                    'status': ['status', 'state', 'lead status', 'current status', 'leadstatus', 'lead_status', 'lead-status', 'currentstatus'],
                    'industry_type_link': ['industry link', 'industry type link', 'industry_link', 'industry_type_link', 'industry l', 'industry-link', 'industrylink'],
                    'employee_size_link': ['employee size link', 'employee_size_link', 'staff size link', 'employee size l', 'employee-size-link', 'employeesizelink'],
                    'revenue_size_link': ['revenue link', 'revenue size link', 'revenue_link', 'revenue_size_link', 'revenue size l', 'revenue l', 'revenue !', 'revenue-link', 'revenuelink']
                };

                const getValue = (cols, fieldKey) => {
                    const normalizedKey = fieldKey.toLowerCase();
                    let index = headerMap[normalizedKey];

                    if (index === undefined && COL_ALIASES[normalizedKey]) {
                        for (const alias of COL_ALIASES[normalizedKey]) {
                            if (headerMap[alias] !== undefined) {
                                index = headerMap[alias];
                                break;
                            }
                        }
                    }

                    if (index === undefined) {
                        const key = fieldKey.toLowerCase().replace(/_/g, ' ');
                        index = headerMap[key];
                    }

                    if (index === undefined) return '';
                    const val = cols[index];
                    return val ? val.trim() : '';
                };

                const normalizeDate = (dateStr) => {
                    if (!dateStr) return new Date().toISOString().split('T')[0];
                    let cleanDateStr = dateStr.toString().trim();
                    if (/^\d{5}(\.\d+)?$/.test(cleanDateStr)) {
                        const excelEpoch = new Date(1899, 11, 30);
                        const days = parseFloat(cleanDateStr);
                        const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
                    }
                    if (/^\d{4}-\d{2}-\d{2}/.test(cleanDateStr)) return cleanDateStr.substring(0, 10);
                    cleanDateStr = cleanDateStr.split(' ')[0].split('T')[0];
                    const parts = cleanDateStr.split(/[./-]/);
                    if (parts.length === 3) {
                        let y, m, d;
                        if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
                        else if (parts[2].length === 4) {
                            d = parts[0].padStart(2, '0');
                            m = parts[1].padStart(2, '0');
                            y = parts[2];
                        } else if (parts[2].length === 2) {
                            d = parts[0].padStart(2, '0');
                            m = parts[1].padStart(2, '0');
                            y = (parseInt(parts[2]) > 50 ? '19' : '20') + parts[2];
                        }
                        if (y && m && d) return `${y}-${m}-${d}`;
                    }
                    const timestamp = Date.parse(dateStr);
                    if (!isNaN(timestamp)) return new Date(timestamp).toISOString().split('T')[0];
                    return new Date().toISOString().split('T')[0];
                };

                let skippedCount = 0;
                let missingCampaignCount = 0;
                let internalDuplicateCount = 0;
                let invalidEmailCount = 0;
                const newLeads = [];
                const seenEmails = new Set();

                for (let i = 1; i < rows.length; i++) {
                    const columns = rows[i];
                    const companyName = getValue(columns, 'company_name');
                    const email = getValue(columns, 'email');

                    if (!companyName) {
                        skippedCount++;
                        continue;
                    }

                    // Professional email validation
                    if (email && !isProfessionalEmail(email)) {
                        invalidEmailCount++;
                        continue;
                    }

                    if (email) {
                        if (seenEmails.has(email.toLowerCase())) {
                            internalDuplicateCount++;
                            continue;
                        }
                        seenEmails.add(email.toLowerCase());
                    }

                    const rawCampaignName = selectedBulkCampaign || getValue(columns, 'Campaign');
                    let campaignName = '';
                    const customQuestionResponses = {};

                    if (rawCampaignName) {
                        const campaignObj = campaigns.find(c =>
                            c.name.toLowerCase() === rawCampaignName.toLowerCase()
                        );

                        if (campaignObj) {
                            campaignName = campaignObj.name;
                            if (campaignObj.custom_questions) {
                                campaignObj.custom_questions.forEach(q => {
                                    const answer = getValue(columns, q.question);
                                    if (answer) customQuestionResponses[q.id] = answer;
                                });
                            }
                        } else {
                            missingCampaignCount++;
                        }
                    }

                    const leadId = getValue(columns, 'id');
                    const leadData = {};

                    const setField = (dbKey, csvKey, fallback = null) => {
                        const val = getValue(columns, csvKey);
                        if (val !== '') {
                            leadData[dbKey] = val;
                        } else if (!leadId && fallback !== null) {
                            leadData[dbKey] = fallback;
                        }
                    };

                    const rawDate = getValue(columns, 'date') || getValue(columns, 'current date');
                    leadData.date = normalizeDate(rawDate);
                    setField('ra_name', 'ra name', employeeName);
                    setField('employee_id', 'employee_id', employeeId);

                    const STATUS_MAP = {
                        'qualify': 'qualified',
                        'qualified': 'qualified',
                        'disqualify': 'disqualified',
                        'disqualified': 'disqualified',
                        'tbd': 'tbd',
                        'pending': 'pending',
                        'approved': 'approved',
                        'rejected': 'rejected',
                        'converted': 'converted',
                        'callback': 'callback',
                        'not interested': 'not interested',
                        'dnc': 'dnc'
                    };

                    const rawStatusVal = getValue(columns, 'status');
                    if (rawStatusVal !== '') {
                        const normalizedStatus = rawStatusVal.trim().toLowerCase();
                        if (STATUS_MAP[normalizedStatus]) {
                            leadData.status = STATUS_MAP[normalizedStatus];
                        } else if (!leadId) {
                            leadData.status = 'pending';
                        }
                    } else if (!leadId) {
                        leadData.status = 'pending';
                    }

                    setField('campaign', 'campaign', campaignName || '');
                    setField('company_name', 'company_name');
                    setField('salutation', 'salutation', 'Mr.');
                    setField('first_name', 'first_name');
                    setField('last_name', 'last_name');
                    setField('email', 'email');
                    setField('domain', 'domain');
                    setField('job_title', 'job_title');
                    setField('department', 'department', 'Marketing');
                    setField('job_level', 'job level', 'Mid-level');
                    setField('job_title_link', 'job title link');
                    setField('phone_no', 'phone_no');
                    setField('direct_dial', 'direct dial');
                    setField('address1', 'address1');
                    setField('city', 'city');
                    setField('state', 'state');
                    setField('zip_code', 'zip_code');
                    setField('country', 'country', 'United States');
                    setField('industry_type', 'industry_type', 'Technology');
                    setField('industry_type_link', 'industry_type_link');
                    setField('employee_size', 'employee_size', '1-10');
                    setField('associated_members', 'associated members');
                    setField('employee_size_link', 'employee_size_link');
                    setField('revenue_size', 'revenue_size');
                    setField('revenue_size_link', 'revenue_size_link');
                    setField('tenure', 'tenure');
                    setField('vv_status', 'vv status', 'RPC Verified');
                    setField('ra_comments', 'ra comments');
                    setField('linkedin_url', 'linkedin url');

                    if (Object.keys(customQuestionResponses).length > 0) {
                        leadData.custom_question_responses = customQuestionResponses;
                    }

                    if (leadId) leadData.id = leadId;
                    newLeads.push(leadData);
                }

                if (newLeads.length === 0) {
                    alert(`No valid leads found to import.`);
                    return;
                }

                const batchSize = 500;
                // Store email+campaign combinations for campaign-specific dedup
                const existingInfoMap = { byId: {}, byEmailCampaign: {}, byEmail: {} };
                const idsToFetch = newLeads.map(l => l.id).filter(Boolean);
                const emailsToFetch = newLeads.map(l => l.email).filter(Boolean);

                for (let i = 0; i < idsToFetch.length; i += batchSize) {
                    const batch = idsToFetch.slice(i, i + batchSize);
                    const { data } = await supabase.from('leads').select('id, email, campaign, employee_id, ra_name').in('id', batch);
                    data?.forEach(l => {
                        existingInfoMap.byId[l.id] = { id: l.id, campaign: l.campaign, employee_id: l.employee_id, ra_name: l.ra_name };
                        if (l.email) {
                            const key = `${l.email.toLowerCase()}::${(l.campaign || '').toLowerCase()}`;
                            existingInfoMap.byEmailCampaign[key] = { id: l.id };
                            existingInfoMap.byEmail[l.email.toLowerCase()] = { id: l.id, campaign: l.campaign };
                        }
                    });
                }

                const remainingEmails = emailsToFetch.filter(e => !existingInfoMap.byEmail[e.toLowerCase()]);
                for (let i = 0; i < remainingEmails.length; i += batchSize) {
                    const batch = remainingEmails.slice(i, i + batchSize);
                    const { data } = await supabase.from('leads').select('id, email, campaign, employee_id, ra_name').in('email', batch);
                    data?.forEach(l => {
                        if (l.email) {
                            const key = `${l.email.toLowerCase()}::${(l.campaign || '').toLowerCase()}`;
                            existingInfoMap.byEmailCampaign[key] = { id: l.id };
                            existingInfoMap.byEmail[l.email.toLowerCase()] = { id: l.id, campaign: l.campaign };
                        }
                    });
                }

                const finalLeads = [];
                let dbDuplicateCount = 0;
                let campaignDuplicateCount = 0;

                for (const nl of newLeads) {
                    let existingById = null;
                    if (nl.id) existingById = existingInfoMap.byId[nl.id];

                    if (existingById) {
                        // Update existing lead found by ID
                        dbDuplicateCount++;
                        if (updateExistingLeads) {
                            const { employee_id, ra_name, id, ...updateData } = nl;
                            finalLeads.push({ ...updateData, id: existingById.id });
                        }
                        continue;
                    }

                    // Campaign-specific duplicate check: reject silently if same email+campaign
                    if (nl.email) {
                        const campaignKey = `${nl.email.toLowerCase()}::${(nl.campaign || '').toLowerCase()}`;
                        if (existingInfoMap.byEmailCampaign[campaignKey]) {
                            campaignDuplicateCount++;
                            continue; // Reject - duplicate in same campaign
                        }
                    }

                    const { id, ...insertData } = nl;
                    finalLeads.push(insertData);
                }



                if (finalLeads.length === 0) {
                    alert('No leads to process.');
                    onClose();
                    return;
                }

                const insertBatchSize = 100;
                let successCount = 0;
                const leadsToUpsert = finalLeads.filter(l => l.id);
                const leadsToInsert = finalLeads.filter(l => !l.id);

                for (let i = 0; i < leadsToUpsert.length; i += insertBatchSize) {
                    const batch = leadsToUpsert.slice(i, i + insertBatchSize);
                    for (const record of batch) {
                        const { id, ...updateFields } = record;
                        const { error } = await supabase.from('leads').update(updateFields).eq('id', id);
                        if (error) { alert(`Error updating lead: ${error.message}`); return; }
                    }
                    successCount += batch.length;
                }

                for (let i = 0; i < leadsToInsert.length; i += insertBatchSize) {
                    const batch = leadsToInsert.slice(i, i + insertBatchSize);
                    const { error } = await supabase.from('leads').insert(batch);
                    if (error) { alert(`Error inserting records: ${error.message}`); return; }
                    successCount += batch.length;
                }

                setUploadResult({
                    successCount,
                    dbDuplicateCount,
                    internalDuplicateCount,
                    campaignDuplicateCount,
                    invalidEmailCount,
                    skippedCount,
                    missingCampaignCount
                });
                onSuccess();
            };
            processRows();
        };
        reader.readAsText(csvFile);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none shadow-2xl">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            {leadToEdit ? 'Edit Lead' : 'Upload Leads'}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {uploadResult ? (
                        <div className="animate-in zoom-in-95 fade-in duration-500 max-w-2xl mx-auto py-8">
                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Complete!</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">Your data has been processed successfully.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl">
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Imported</p>
                                    <p className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-100">{uploadResult.successCount}</p>
                                </div>
                                <div className="p-5 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl">
                                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Campaign Dupes</p>
                                    <p className="text-4xl font-extrabold text-rose-900 dark:text-rose-100">{uploadResult.campaignDuplicateCount || 0}</p>
                                </div>
                                <div className="p-5 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl">
                                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">Invalid Emails</p>
                                    <p className="text-4xl font-extrabold text-orange-900 dark:text-orange-100">{uploadResult.invalidEmailCount || 0}</p>
                                </div>
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">CSV Dupes</p>
                                    <p className="text-4xl font-extrabold text-blue-900 dark:text-blue-100">{uploadResult.internalDuplicateCount}</p>
                                </div>
                                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">DB Duplicates</p>
                                    <p className="text-4xl font-extrabold text-amber-900 dark:text-amber-100">{uploadResult.dbDuplicateCount}</p>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Skipped Rows</p>
                                    <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{uploadResult.skippedCount}</p>
                                </div>
                            </div>

                            <Button onClick={() => { setUploadResult(null); onClose(); }} className="w-full py-4 text-lg">
                                Return to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!leadToEdit && (
                                <div className="flex bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 border border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setUploadType('single')}
                                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${uploadType === 'single' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Single Lead
                                    </button>
                                    <button
                                        onClick={() => setUploadType('bulk')}
                                        className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${uploadType === 'bulk' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Bulk Upload
                                    </button>
                                </div>
                            )}

                            {uploadType === 'single' ? (
                                <form onSubmit={handleSingleSubmit} className="space-y-8 animate-in fade-in duration-500">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                                            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Basic Information</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Select
                                                    label="Campaign *"
                                                    value={formData.campaign}
                                                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                                                    options={[{ value: '', label: '-- Select Campaign --' }, ...campaigns.map(c => ({ value: c.name, label: c.name }))]}
                                                    required
                                                />
                                            </div>
                                            <Select
                                                label="Salutation"
                                                value={formData.salutation}
                                                onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                                                options={['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'].map(s => ({ value: s, label: s }))}
                                            />
                                            <div className="hidden md:block"></div>
                                            <Input label="First Name *" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} error={errors.first_name} required />
                                            <Input label="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                                            <Input label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} required />
                                            <Input label="Phone Number" value={formData.phone_no} onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })} error={errors.phone_no} />
                                            <Input label="Direct Dial" value={formData.direct_dial} onChange={(e) => setFormData({ ...formData, direct_dial: e.target.value })} error={errors.direct_dial} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                                            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Company Information</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Input label="Company Name *" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} error={errors.company_name} required />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleEnrich}
                                                    disabled={isEnriching}
                                                    className="mb-1"
                                                >
                                                    {isEnriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                                                </Button>
                                            </div>
                                            <Input label="Domain" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
                                            <Input label="Job Title" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
                                            <Input label="Job Title Link" value={formData.job_title_link} onChange={(e) => setFormData({ ...formData, job_title_link: e.target.value })} />
                                            <Select label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} options={departments.map(d => ({ value: d, label: d }))} />
                                            <Select label="Job Level" value={formData.job_level} onChange={(e) => setFormData({ ...formData, job_level: e.target.value })} options={jobLevels.map(l => ({ value: l, label: l }))} />
                                            <Select label="Industry Type" value={formData.industry_type} onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })} options={industries.map(i => ({ value: i, label: i }))} />
                                            <Input label="Industry Link" value={formData.industry_type_link} onChange={(e) => setFormData({ ...formData, industry_type_link: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                                            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Location & Size</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Address" value={formData.address1} onChange={(e) => setFormData({ ...formData, address1: e.target.value })} />
                                            <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                            <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                                            <Input label="Zip Code" value={formData.zip_code} onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })} />
                                            <Select label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} options={countries.map(c => ({ value: c, label: c }))} />
                                            <Input label="Associated Members" type="number" value={formData.associated_members} onChange={(e) => setFormData({ ...formData, associated_members: e.target.value })} />
                                            <Select label="Employee Size" value={formData.employee_size} onChange={(e) => setFormData({ ...formData, employee_size: e.target.value })} options={employeeSizes.map(s => ({ value: s, label: s }))} />
                                            <Input label="Employee Size Link" value={formData.employee_size_link} onChange={(e) => setFormData({ ...formData, employee_size_link: e.target.value })} />
                                            <Input label="Revenue Size" value={formData.revenue_size} onChange={(e) => setFormData({ ...formData, revenue_size: e.target.value })} />
                                            <Input label="LinkedIn URL" value={formData.linkedin_url || ''} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} />
                                            <Input label="Revenue Link" value={formData.revenue_size_link} onChange={(e) => setFormData({ ...formData, revenue_size_link: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                                            <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Verification</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select label="VV Status" value={formData.vv_status} onChange={(e) => setFormData({ ...formData, vv_status: e.target.value })} options={vvStatusOptions.map(s => ({ value: s, label: s }))} />
                                            <Input label="Tenure" value={formData.tenure} onChange={(e) => setFormData({ ...formData, tenure: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">RA Comments</label>
                                        <textarea
                                            value={formData.ra_comments}
                                            onChange={(e) => setFormData({ ...formData, ra_comments: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            rows="3"
                                            placeholder="Add any comments or notes..."
                                        />
                                    </div>

                                    {formData.campaign && campaigns.find(c => c.name === formData.campaign)?.custom_questions?.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Additional Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {campaigns.find(c => c.name === formData.campaign).custom_questions.map((q) => (
                                                    <div key={q.id} className="md:col-span-2">
                                                        <Input
                                                            label={q.question}
                                                            value={formData.custom_question_responses?.[q.id] || ''}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                custom_question_responses: { ...formData.custom_question_responses, [q.id]: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
                                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                                        <Button type="submit" className="min-w-[150px]">
                                            <Upload className="w-4 h-4 mr-2" />
                                            {leadToEdit ? 'Update Lead' : 'Upload Lead'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleBulkUpload} className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-4">
                                        <Select
                                            label="Select Campaign (Required) *"
                                            value={selectedBulkCampaign}
                                            onChange={(e) => setSelectedBulkCampaign(e.target.value)}
                                            options={[{ value: '', label: '-- Select Campaign --' }, ...campaigns.map(c => ({ value: c.name, label: c.name }))]}
                                            required
                                        />
                                        {(currentUser?.role === 'qa' || currentUser?.role === 'admin') && (
                                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                                                <input
                                                    type="checkbox"
                                                    id="update-existing"
                                                    checked={updateExistingLeads}
                                                    onChange={(e) => setUpdateExistingLeads(e.target.checked)}
                                                    className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700 rounded cursor-pointer"
                                                />
                                                <label htmlFor="update-existing" className="text-sm font-bold text-amber-800 dark:text-amber-400 cursor-pointer">
                                                    Update existing leads (match by email)
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="group relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl p-12 text-center transition-all hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="w-8 h-8 text-gray-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                            </div>
                                            <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">
                                                {csvFile ? csvFile.name : 'Click to upload or drag & drop'}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Supported format: .csv</p>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col items-center gap-4 relative z-10">
                                            <button
                                                type="button"
                                                onClick={downloadTemplate}
                                                className="group/link text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-2 transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="underline underline-offset-4 decoration-indigo-200 dark:decoration-indigo-800">
                                                    Download CSV Template
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
                                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                                        <Button type="submit" disabled={!csvFile} className="min-w-[150px]">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Process CSV
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default UploadLeadModal;
