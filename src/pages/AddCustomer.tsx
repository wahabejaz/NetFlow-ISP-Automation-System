import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, ArrowLeft, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { addCustomer, getAreas, getPackages } from '../services/db';
import type { Customer, Package } from '../services/db';
import { 
  formatCNIC, 
  formatPhone, 
  validateCNIC, 
  validatePhone, 
  validateEmail, 
  validateDOB,
  validateHouseNo,
  validateStreet,
  validateArea,
  validateCity,
  validateZipCode,
  validateCoordinates
} from '../utils/validation';

const steps = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Address' },
  { id: 3, title: 'Package' },
  { id: 4, title: 'Confirm' },
];

export default function AddCustomer() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [packages, setPackages] = useState<Package[]>([]);
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Consolidated Form State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Male',
    password: '',
    houseNo: '',
    street: '',
    area: '',
    city: '',
    zipCode: '',
    coordinates: '',
    packageId: '',
    installationPaid: 'Yes',
    billingStart: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pkgData, areaData] = await Promise.all([getPackages(), getAreas()]);
        setPackages(pkgData);
        setAreaOptions(areaData.areas);
        setCityOptions(areaData.cities);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, []);

  const selectedPackage = packages.find(pkg => pkg.id === formData.packageId || pkg.name.toLowerCase() === formData.packageId.toLowerCase());

  // Validation Check
  const getStepOneErrors = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!formData.fatherName.trim()) errs.fatherName = 'Father name is required.';
    if (!formData.cnic.trim()) errs.cnic = 'CNIC is required.';
    else if (!validateCNIC(formData.cnic)) errs.cnic = 'CNIC must match standard format XXXXX-XXXXXXX-X.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    else if (!validatePhone(formData.phone)) errs.phone = 'Phone number must match Pakistani standard format 03XX-XXXXXXX.';
    if (formData.email.trim() && !validateEmail(formData.email)) errs.email = 'Please enter a valid email address.';
    if (!formData.dob.trim()) errs.dob = 'Date of birth is required.';
    else {
      const dobCheck = validateDOB(formData.dob);
      if (!dobCheck.isValid) errs.dob = dobCheck.message || 'Invalid Date of Birth.';
    }
    if (!formData.password.trim()) errs.password = 'Create a password for the customer account.';
    return errs;
  };

  const getStepTwoErrors = () => {
    const errs: Record<string, string> = {};
    
    const houseNoCheck = validateHouseNo(formData.houseNo);
    if (!houseNoCheck.isValid && houseNoCheck.message) {
      errs.houseNo = houseNoCheck.message;
    }
    
    const streetCheck = validateStreet(formData.street);
    if (!streetCheck.isValid && streetCheck.message) {
      errs.street = streetCheck.message;
    }
    
    const areaCheck = validateArea(formData.area);
    if (!areaCheck.isValid && areaCheck.message) {
      errs.area = areaCheck.message;
    }
    
    const cityCheck = validateCity(formData.city);
    if (!cityCheck.isValid && cityCheck.message) {
      errs.city = cityCheck.message;
    }
    
    const zipCodeCheck = validateZipCode(formData.zipCode);
    if (!zipCodeCheck.isValid && zipCodeCheck.message) {
      errs.zipCode = zipCodeCheck.message;
    }
    
    const coordinatesCheck = validateCoordinates(formData.coordinates);
    if (!coordinatesCheck.isValid && coordinatesCheck.message) {
      errs.coordinates = coordinatesCheck.message;
    }
    
    return errs;
  };

  const stepOneErrs = getStepOneErrors();
  const stepTwoErrs = getStepTwoErrors();

  const isNextButtonDisabled = currentStep === 1
    ? Object.keys(stepOneErrs).length > 0
    : currentStep === 2
      ? Object.keys(stepTwoErrs).length > 0
      : currentStep === 3
        ? !formData.packageId
        : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    // Auto formatting
    if (name === 'cnic') {
      value = formatCNIC(value);
    } else if (name === 'phone') {
      value = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // We only clear the error on change, and validate completely on ValidateStep.
    // However, for immediate visual feedback of corrections:
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const stepErrs = currentStep === 1 ? getStepOneErrors() : currentStep === 2 ? getStepTwoErrors() : {};
    if (stepErrs[name]) {
      setErrors(prev => ({ ...prev, [name]: stepErrs[name] }));
    }
  };

  const fieldErrorStyle = (field: string) => {
    return errors[field] ? { borderColor: '#dc2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.06)' } : {};
  };

  const validateStep = () => {
    const stepErrs = currentStep === 1 ? getStepOneErrors() : currentStep === 2 ? getStepTwoErrors() : {};
    if (currentStep === 3 && !formData.packageId) {
      stepErrs.packageId = 'Select a package to continue.';
    }
    
    setErrors(stepErrs);
    return Object.keys(stepErrs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    try {
      const newCustomer: Customer = {
        fullName: formData.fullName,
        fatherName: formData.fatherName,
        cnic: formData.cnic,
        phone: formData.phone,
        email: formData.email || 'customer@netflow.local',
        dob: formData.dob,
        gender: formData.gender,
        photo: photoFile,
        houseNo: formData.houseNo,
        street: formData.street,
        area: formData.area,
        city: formData.city,
        zipCode: formData.zipCode,
        coordinates: formData.coordinates,
        packageId: formData.packageId,
        status: 'Active',
        bill: selectedPackage?.price || '0 PKR',
        password: formData.password,
      };

      await addCustomer(newCustomer);
      alert('Customer Registered Successfully!');
      navigate('/customers');
    } catch (err) {
      console.error(err);
      alert('Failed to register customer: ' + err);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/customers');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    const file = e.target.files[0];
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0 3rem 0' }}>
      
      {/* Progress Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '12px', left: '10%', right: `calc(100% - 10% - ${(currentStep - 1) * 26.6}%)`, height: '2px', background: '#0d9488', zIndex: 0, transition: 'right 0.3s' }}></div>
        
        {steps.map((step) => (
          <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
             <div style={{ fontSize: '0.8rem', fontWeight: 600, color: currentStep >= step.id ? '#0d9488' : 'var(--text-light)', marginBottom: '0.25rem' }}>Step {step.id}:</div>
             <div style={{ fontSize: '0.85rem', fontWeight: currentStep === step.id ? 700 : 500, color: currentStep >= step.id ? 'var(--text-dark)' : 'var(--text-light)', marginBottom: '0.5rem' }}>{step.title}</div>
             <div style={{ width: 14, height: 14, borderRadius: '50%', border: currentStep >= step.id ? '2px solid #0d9488' : '2px solid var(--border-color)', background: currentStep >= step.id ? (currentStep === step.id ? 'white' : '#0d9488') : 'white', transition: 'background-color 0.3s' }}></div>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="glass-panel" style={{ padding: '2.5rem', background: 'white' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Add New Customer — Step {currentStep} of 4: {steps.find(s => s.id === currentStep)?.title}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0d9488' }}>{Math.round(((currentStep - 1) / 3) * 100)}% Complete</span>
        </h2>

        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('fullName')) }} placeholder="e.g. John Doe" />
                {errors.fullName && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.fullName}</div>}
              </div>
              <div>
                <label className="form-label">Father Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('fatherName')) }} placeholder="e.g. Richard Doe" />
                {errors.fatherName && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.fatherName}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <label className="form-label">CNIC</label>
                <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} onBlur={handleBlur} placeholder="XXXXX-XXXXXXX-X" className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('cnic')) }} />
                {errors.cnic && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.cnic}</div>}
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="form-control" style={{ width: '85px', background: '#f8fafc' }}>
                    <option>🇵🇰 +92</option>
                  </select>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ flex: 1, background: '#f8fafc', ...(fieldErrorStyle('phone')) }} placeholder="0300-1234567" />
                </div>
                {errors.phone && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.phone}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Email Address <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(Optional)</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('email')) }} placeholder="john.doe@example.com" />
                {errors.email && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.email}</div>}
              </div>
              <div>
                <label className="form-label">Account Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', paddingRight: '2.75rem', ...(fieldErrorStyle('password')) }} placeholder="Set login password" required />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-light)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.password}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', color: 'var(--text-dark)', ...(fieldErrorStyle('dob')) }} />
                {errors.dob && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.dob}</div>}
              </div>
              <div>
                <label className="form-label">Gender</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['Male', 'Female'].map(g => (
                    <label key={g} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: formData.gender === g ? '2px solid #0d9488' : '1px solid var(--border-color)', borderRadius: '6px', background: formData.gender === g ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="radio" name="gender" checked={formData.gender === g} onChange={() => setFormData(p => ({ ...p, gender: g }))} style={{ accentColor: '#0d9488' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: formData.gender === g ? 600 : 400 }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Profile Photo Upload</label>
              <label style={{ display: 'block', border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                {photoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.875rem', color: '#0d9488', fontWeight: 600 }}>Photo Selected</span>
                  </div>
                ) : (
                  <>
                    <Camera size={24} color="var(--text-light)" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>Click to upload a profile photo</div>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Address Info */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">House / Apartment No</label>
                <input type="text" name="houseNo" value={formData.houseNo} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('houseNo')) }} placeholder="e.g. House 45-B" />
                {errors.houseNo && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.houseNo}</div>}
              </div>
              <div>
                <label className="form-label">Street / Lane</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('street')) }} placeholder="e.g. Street 7" />
                {errors.street && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.street}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Area / Sector</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('area')) }} placeholder="e.g. DHA Phase 4" list="area-options" />
                <datalist id="area-options">
                  {areaOptions.map(area => <option key={area} value={area} />)}
                </datalist>
                {errors.area && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.area}</div>}
              </div>
              <div>
                <label className="form-label">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('city')) }} placeholder="e.g. Lahore" list="city-options" />
                <datalist id="city-options">
                  {cityOptions.map(city => <option key={city} value={city} />)}
                </datalist>
                {errors.city && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.city}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Postal / Zip Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('zipCode')) }} placeholder="e.g. 54000" />
                {errors.zipCode && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.zipCode}</div>}
              </div>
              <div>
                <label className="form-label">GPS Coordinates <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(Optional)</span></label>
                <input type="text" name="coordinates" value={formData.coordinates} onChange={handleChange} onBlur={handleBlur} className="form-control" style={{ background: '#f8fafc', ...(fieldErrorStyle('coordinates')) }} placeholder="31.4826, 74.3702" />
                {errors.coordinates && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.coordinates}</div>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Package selection */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 600 }}>Select Internet Package</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {packages.length === 0 ? (
                <div style={{ color: 'var(--text-light)' }}>Loading available packages...</div>
              ) : (
                packages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setFormData(prev => ({ ...prev, packageId: pkg.id || pkg.name }))}
                    style={{
                      border: formData.packageId === (pkg.id || pkg.name) ? '2px solid #0d9488' : '1px solid var(--border-color)',
                      background: formData.packageId === (pkg.id || pkg.name) ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{pkg.name}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)', margin: '0.5rem 0' }}>{pkg.speed}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>{pkg.price}</div>
                  </div>
                ))
              )}
            </div>
            {errors.packageId && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>{errors.packageId}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <label className="form-label">Billing Cycle Start Date</label>
                <input type="date" name="billingStart" value={formData.billingStart} onChange={handleChange} className="form-control" style={{ background: '#f8fafc' }} />
              </div>
              <div>
                <label className="form-label">Installation Fee Paid?</label>
                <select name="installationPaid" value={formData.installationPaid} onChange={handleChange} className="form-control" style={{ background: '#f8fafc' }}>
                  <option value="Yes">Yes (Paid)</option>
                  <option value="No">No (Pending)</option>
                  <option value="Free">Waived / Free Promotion</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.5rem' }}>
               <CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 0.5rem' }} />
               <h3 style={{ color: '#166534', margin: 0, fontSize: '1.1rem' }}>Please verify the details below before creating customer.</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', background: '#fafafa' }}>
                <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Personal Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div><strong>Full Name:</strong> {formData.fullName || '—'}</div>
                  <div><strong>Father Name:</strong> {formData.fatherName || '—'}</div>
                  <div><strong>CNIC:</strong> {formData.cnic || '—'}</div>
                  <div><strong>Phone:</strong> +92 {formData.phone || '—'}</div>
                  <div><strong>Email:</strong> {formData.email || '—'}</div>
                  <div><strong>Password:</strong> {formData.password ? '••••••••' : '—'}</div>
                  <div><strong>DOB:</strong> {formData.dob || '—'}</div>
                  <div><strong>Gender:</strong> {formData.gender}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#fafafa' }}>
                  <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Address Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div>{formData.houseNo && formData.street ? `${formData.houseNo}, ${formData.street}` : '—'}</div>
                    <div>{formData.area}, {formData.city}</div>
                    {formData.zipCode && <div><strong>Zip:</strong> {formData.zipCode}</div>}
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#fafafa' }}>
                  <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Service Package</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div><strong>Selected Tier:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selectedPackage?.name || formData.packageId}</span></div>
                    <div><strong>Bill Amount:</strong> {selectedPackage?.price || '—'}</div>
                    <div><strong>Start Date:</strong> {formData.billingStart || 'Immediately'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn btn-outline" 
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            onClick={handleBack}
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentStep < 4 && (
              <button className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <Save size={16} /> Save Draft
              </button>
            )}
            <button 
              className="btn btn-primary" 
              style={{ 
                background: isNextButtonDisabled ? '#94a3b8' : '#0f766e', 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center', 
                cursor: isNextButtonDisabled ? 'not-allowed' : 'pointer' 
              }} 
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
               {currentStep === 4 ? 'Complete Registration' : <>Continue <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
