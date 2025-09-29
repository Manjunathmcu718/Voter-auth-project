import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, CheckCircle, Vote, ToggleLeft, ToggleRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

import AuthForm from '../components/voter/AuthForm';
import EnhancedAuthForm from '../components/voter/EnhancedAuthForm'; // Import the new form
import OTPVerification from '../components/voter/OTPVerification';
import VotingStatus from '../components/voter/VotingStatus';

const VoterAuthPage = () => {
    const [step, setStep] = useState(1);
    const [voterData, setVoterData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [authMode, setAuthMode] = useState('simple'); // 'simple' or 'enhanced'

    const handleAuthSubmit = async (formData) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);
            const voter = response.data;

            if (voter.has_voted) {
                setVoterData(voter);
                setStep(3); // Go directly to status page if already voted
            } else {
                setVoterData(voter);
                setStep(2); // Proceed to OTP verification
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        }
        setIsLoading(false);
    };

    const handleOTPVerify = async (enteredOTP) => {
        setIsLoading(true);
        setError('');
        try {
             const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
                phone_number: voterData.phone_number,
                otp: enteredOTP,
            });
            setVoterData(response.data.voter); // Update voter data with fresh data from backend
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Please try again.');
        }
        setIsLoading(false);
    };

    const handleResendOTP = async () => {
        if (!voterData) {
            setError('No voter data to resend OTP to. Please authenticate again.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/resend-otp', { phone_number: voterData.phone_number });
            // The backend sends the new OTP, but we don't need to show it on the frontend anymore.
            alert("A new OTP has been sent to your phone.");
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP.');
        }
        setIsLoading(false);
    };

    const handleVoteAction = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!voterData || voterData.has_voted) {
                setError('Cannot vote. Voter data missing or already voted.');
                return;
            }
            const response = await axios.post('http://localhost:5000/api/vote/cast', { voter_id: voterData.voter_id });
            setVoterData(response.data.voter);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update voting status.');
        }
        setIsLoading(false);
    };

    const resetFlow = () => {
        setStep(1);
        setVoterData(null);
        setError('');
        setIsLoading(false);
    };
    
    const toggleAuthMode = () => {
        setAuthMode(currentMode => (currentMode === 'simple' ? 'enhanced' : 'simple'));
        resetFlow();
    };

    return (
        <div className="min-h-screen py-8 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow-lg border-4 border-white">
                        <Shield className="w-8 h-8 text-blue-700" />
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-3"
                    >
                        <span className="text-purple-700">Voter</span>{' '}
                        <span className="text-blue-600">Authentication</span>
                    </motion.h1>
                </header>

                {/* Auth Mode Toggle */}
                <div className="flex justify-center items-center gap-3 mb-8">
                    <span className={`font-medium ${authMode === 'simple' ? 'text-blue-600' : 'text-gray-500'}`}>Simple Login</span>
                    <button onClick={toggleAuthMode} className="focus:outline-none">
                        {authMode === 'simple' ? 
                            <ToggleLeft className="w-10 h-10 text-gray-400 hover:text-blue-600 transition-colors" /> :
                            <ToggleRight className="w-10 h-10 text-blue-600" />
                        }
                    </button>
                    <span className={`font-medium ${authMode === 'enhanced' ? 'text-blue-600' : 'text-gray-500'}`}>Enhanced Verification</span>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 max-w-md mx-auto">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                         authMode === 'simple' ? 
                            <AuthForm key="auth" onSubmit={handleAuthSubmit} isLoading={isLoading} /> :
                            <EnhancedAuthForm key="enhanced-auth" onSubmit={handleAuthSubmit} isLoading={isLoading} />
                    )}
                    {step === 2 && (
                        <OTPVerification
                            key="otp"
                            voterData={voterData}
                            onVerify={handleOTPVerify}
                            onBack={resetFlow}
                            onResendOTP={handleResendOTP}
                            isLoading={isLoading}
                        />
                    )}
                    {step === 3 && <VotingStatus key="status" voterData={voterData} onVote={handleVoteAction} onReset={resetFlow} isLoading={isLoading} />}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VoterAuthPage;
// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Shield, Phone, CheckCircle, Vote, Database } from 'lucide-react';

// // Import your existing components
// import AuthForm from '../components/voter/AuthForm';
// import OTPVerification from '../components/voter/OTPVerification';
// import VotingStatus from '../components/voter/VotingStatus';
// // Add the new import for the GovernmentVerification component
// import GovernmentVerification from '../components/voter/GovernmentVerification';

// export default function VoterAuthPage() {
//   // Use a string for the step to accommodate the new 'gov-verify' step
//   const [step, setStep] = useState(1); 
//   const [voterData, setVoterData] = useState(null);
//   const [voterIdForOTP, setVoterIdForOTP] = useState(null);
//   const [otpForTesting, setOtpForTesting] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   // New state to hold the form data while we run government verification
//   const [formDataForGov, setFormDataForGov] = useState(null);

//   const resetFlow = () => {
//     setStep(1);
//     setVoterData(null);
//     setVoterIdForOTP(null);
//     setOtpForTesting(null);
//     setFormDataForGov(null);
//     setError('');
//     setIsLoading(false);
//   };

//   // Step 1: User submits their details.
//   const handleAuthSubmit = (formData) => {
//     // Instead of calling the backend directly, we now trigger the government verification step
//     setFormDataForGov(formData);
//     setStep('gov-verify'); // Switch to the new government verification step
//   };

//   // Step 2: The GovernmentVerification component finishes.
//   const handleGovVerificationComplete = async (report) => {
//     // This function is called by the GovernmentVerification component when it's done
//     if (report.overall_status === 'VERIFIED') {
//       // If verification is successful, NOW we call the backend to get an OTP
//       setIsLoading(true);
//       setError('');
//       try {
//         // We use the same formData that was successfully verified
//         const response = await fetch('http://localhost:5000/api/auth/authenticate', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(formDataForGov),
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error || 'Authentication failed');

//         if (data.status === 'already_voted') {
//           setVoterData(data.voter);
//           setStep(3);
//         } else if (data.status === 'otp_sent') {
//           setVoterIdForOTP(data.voter_id);
//           setOtpForTesting(data.otp_for_testing);
//           setStep(2); // Proceed to OTP screen
//         }
//       } catch (err) {
//         setError(err.message);
//         setStep(1); // Go back to the start on error
//       }
//       setIsLoading(false);
//     } else {
//       // If verification failed, show an error and go back to step 1
//       setError(`Government ID verification failed. Reason: ${report.overall_status}`);
//       setStep(1);
//     }
//   };

//   // Step 3: User verifies OTP.
//   const handleOTPVerify = async (enteredOTP) => {
//     setIsLoading(true);
//     setError('');
//     try {
//       const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ otp: enteredOTP, voter_id: voterIdForOTP }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'OTP verification failed');
//       }

//       if (data.status === 'verified') {
//         setVoterData(data.voter);
//         setStep(3); // Proceed to the final voting status screen
//       }
//     } catch (err) {
//       setError(err.message);
//     }
//     setIsLoading(false);
//   };

//   // Step 4: User casts their vote.
//   const handleVoteAction = async () => {
//     setIsLoading(true);
//     setError('');
//     try {
//       if (!voterData || !voterData._id) {
//         throw new Error('Voter session data is missing. Please start over.');
//       }
//       const response = await fetch('http://localhost:5000/api/auth/vote', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ voterId: voterData._id }),
//       });
//       const updatedVoter = await response.json();
//       if (!response.ok) throw new Error(updatedVoter.error || 'Failed to record vote');
//       setVoterData(updatedVoter);
//     } catch (err) {
//       setError(err.message);
//     }
//     setIsLoading(false);
//   };

//   // --- UI and Progress Steps ---
//   const progressSteps = [
//     { id: 1, name: 'Details', icon: Shield },
//     { id: 'gov-verify', name: 'Govt. Verify', icon: Database },
//     { id: 2, name: 'OTP Verify', icon: Phone },
//     { id: 3, name: 'Vote Status', icon: Vote },
//   ];

//   return (
//     <div className="min-h-screen py-8 px-4 bg-gray-50">
//       <div className="max-w-4xl mx-auto">
//         <header className="text-center mb-10">
//           <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow-lg border-4 border-white">
//             <Shield className="w-8 h-8 text-blue-700" />
//           </div>
//           <motion.h1
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-4xl md:text-5xl font-bold mb-3"
//           >
//             <span className="text-purple-700">Voter</span>{" "}
//             <span className="text-blue-600">Authentication</span>
//           </motion.h1>
//         </header>

//         {/* Progress Steps */}
//         <div className="mb-8">
//           <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
//             {progressSteps.map((item, index) => {
//               let isActive = false;
//               if (typeof step === 'number') {
//                 isActive = item.id <= step;
//               } else if (step === 'gov-verify') {
//                 isActive = item.id === 1 || item.id === 'gov-verify';
//               }

//               return (
//                 <React.Fragment key={item.id}>
//                   <div className="flex flex-col items-center">
//                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
//                       isActive 
//                         ? "bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg" 
//                         : "bg-gray-200 text-gray-500"
//                     }`}>
//                       <item.icon className="w-6 h-6" />
//                     </div>
//                     <span className="text-sm text-gray-600 mt-2 hidden sm:block">{item.name}</span>
//                   </div>
//                   {index < progressSteps.length - 1 && (
//                     <div className={`flex-1 h-1 transition-all duration-300 max-w-24 ${
//                       isActive ? "bg-gradient-to-r from-orange-500 to-green-500" : "bg-gray-200"
//                     }`} />
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </div>
//         </div>
        
//         {/* Error Display */}
//         <AnimatePresence>
//           {error && (
//             <motion.div 
//               initial={{ opacity: 0, y: -10 }} 
//               animate={{ opacity: 1, y: 0 }} 
//               exit={{ opacity: 0, y: -10 }} 
//               className="mb-6 max-w-md mx-auto"
//             >
//               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
//                 <div className="flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
//                   </svg>
//                   {error}
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Step Components */}
//         <AnimatePresence mode="wait">
//           {step === 1 && (
//             <AuthForm 
//               key="auth" 
//               onSubmit={handleAuthSubmit} 
//               isLoading={isLoading} 
//             />
//           )}

//           {/* New Step Rendering */}
//           {step === 'gov-verify' && (
//             <GovernmentVerification
//               key="gov-verify"
//               formData={formDataForGov}
//               onComplete={handleGovVerificationComplete}
//             />
//           )}

//           {step === 2 && (
//             <OTPVerification 
//               key="otp" 
//               phoneNumber={formDataForGov?.phone_number || '******'} // Display phone number from stored form data
//               otpForTesting={otpForTesting}
//               onVerify={handleOTPVerify} 
//               onBack={resetFlow}
//               isLoading={isLoading} 
//             />
//           )}

//           {step === 3 && (
//             <VotingStatus 
//               key="status" 
//               voterData={voterData} 
//               onVote={handleVoteAction} 
//               onReset={resetFlow} 
//               isLoading={isLoading} 
//             />
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }
// // import React, { useState } from 'react';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { Shield, Phone, CheckCircle, Vote } from 'lucide-react';

// // // Import your existing components
// // import AuthForm from '../components/voter/AuthForm';
// // import OTPVerification from '../components/voter/OTPVerification';
// // import VotingStatus from '../components/voter/VotingStatus';
// // import GovernmentVerification from '../components/voter/GovernmentVerification';


// // export default function VoterAuthPage() {
// //   const [step, setStep] = useState(1);
// //   const [voterData, setVoterData] = useState(null);
// //   const [voterIdForOTP, setVoterIdForOTP] = useState(null);
// //   const [otpForTesting, setOtpForTesting] = useState(null);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [error, setError] = useState('');

// //   const resetFlow = () => {
// //     setStep(1);
// //     setVoterData(null);
// //     setVoterIdForOTP(null);
// //     setOtpForTesting(null);
// //     setError('');
// //     setIsLoading(false);
// //   };

// //   const handleAuthSubmit = async (formData) => {
// //     setIsLoading(true);
// //     setError('');
// //     try {
// //       const response = await fetch('http://localhost:5000/api/auth/authenticate', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(formData),
// //       });
// //       const data = await response.json();

// //       if (!response.ok) {
// //         throw new Error(data.error || 'Authentication failed');
// //       }

// //       if (data.status === 'already_voted') {
// //         setVoterData(data.voter);
// //         setStep(3);
// //       } else if (data.status === 'otp_sent') {
// //         setVoterIdForOTP(data.voter_id);
// //         setOtpForTesting(data.otp_for_testing);
// //         setStep(2);
// //       }
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //     setIsLoading(false);
// //   };

// //   const handleOTPVerify = async (enteredOTP) => {
// //     setIsLoading(true);
// //     setError('');
// //     try {
// //       const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ otp: enteredOTP, voter_id: voterIdForOTP }),
// //       });
// //       const data = await response.json();

// //       if (!response.ok) {
// //         throw new Error(data.error || 'OTP verification failed');
// //       }

// //       if (data.status === 'verified') {
// //         setVoterData(data.voter);
// //         setStep(3);
// //       }
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //     setIsLoading(false);
// //   };

// //   const handleVoteAction = async () => {
// //     setIsLoading(true);
// //     setError('');
// //     try {
// //       if (!voterData || !voterData._id) {
// //         throw new Error('Voter session data is missing. Please start over.');
// //       }

// //       console.log('Sending vote request with voterId:', voterData._id); // Debug

// //       const response = await fetch('http://localhost:5000/api/auth/vote', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ voterId: voterData._id }),
// //       });
// //       const updatedVoter = await response.json();

// //       if (!response.ok) {
// //         throw new Error(updatedVoter.error || 'Failed to record vote');
// //       }

// //       setVoterData(updatedVoter);
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //     setIsLoading(false);
// //   };

// //   const progressSteps = [
// //     { id: 1, name: 'Authenticate', icon: Shield },
// //     { id: 2, name: 'Verify OTP', icon: Phone },
// //     { id: 3, name: 'Vote Status', icon: Vote },
// //   ];

// //   return (
// //     <div className="min-h-screen py-8 px-4 bg-gray-50">
// //       <div className="max-w-4xl mx-auto">
// //         {/* Header */}
// //         <header className="text-center mb-10">
// //           <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center shadow-lg border-4 border-white">
// //             <Shield className="w-8 h-8 text-blue-700" />
// //           </div>
// //           <motion.h1
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             className="text-4xl md:text-5xl font-bold mb-3"
// //           >
// //             <span className="text-purple-700">Voter</span>{" "}
// //             <span className="text-blue-600">Authentication</span>
// //           </motion.h1>
// //           <motion.p
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ delay: 0.1 }}
// //             className="text-lg text-gray-600 max-w-2xl mx-auto"
// //           >
// //             Secure digital verification for Indian voters. Authenticate your identity and check your voting status.
// //           </motion.p>
// //         </header>

// //         {/* Progress Steps */}
// //         <div className="mb-8">
// //           <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
// //             {progressSteps.map((item, index) => (
// //               <React.Fragment key={item.id}>
// //                 <div className="flex flex-col items-center">
// //                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
// //                     item.id <= step 
// //                       ? "bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg" 
// //                       : "bg-gray-200 text-gray-500"
// //                   }`}>
// //                     {item.id < step ? <CheckCircle className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
// //                   </div>
// //                   <span className="text-sm text-gray-600 mt-2 hidden sm:block">{item.name}</span>
// //                 </div>
// //                 {index < progressSteps.length - 1 && (
// //                   <div className={`flex-1 h-1 transition-all duration-300 max-w-24 ${
// //                     item.id < step ? "bg-gradient-to-r from-orange-500 to-green-500" : "bg-gray-200"
// //                   }`} />
// //                 )}
// //               </React.Fragment>
// //             ))}
// //           </div>
// //         </div>
        
// //         {/* Error Display */}
// //         <AnimatePresence>
// //           {error && (
// //             <motion.div 
// //               initial={{ opacity: 0, y: -10 }} 
// //               animate={{ opacity: 1, y: 0 }} 
// //               exit={{ opacity: 0, y: -10 }} 
// //               className="mb-6 max-w-md mx-auto"
// //             >
// //               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
// //                 <div className="flex items-center">
// //                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
// //                   </svg>
// //                   {error}
// //                 </div>
// //               </div>
// //             </motion.div>
// //           )}
// //         </AnimatePresence>

// //         {/* Step Components */}
// //         <AnimatePresence mode="wait">
// //           {step === 1 && (
// //             <AuthForm 
// //               key="auth" 
// //               onSubmit={handleAuthSubmit} 
// //               isLoading={isLoading} 
// //             />
// //           )}
// //           {step === 2 && (
// //             <OTPVerification 
// //               key="otp" 
// //               phoneNumber="****" 
// //               otpForTesting={otpForTesting}
// //               onVerify={handleOTPVerify} 
// //               onBack={resetFlow}
// //               isLoading={isLoading} 
// //             />
// //           )}
// //           {step === 3 && (
// //             <VotingStatus 
// //               key="status" 
// //               voterData={voterData} 
// //               onVote={handleVoteAction} 
// //               onReset={resetFlow} 
// //               isLoading={isLoading} 
// //             />
// //           )}
// //         </AnimatePresence>
// //       </div>
// //     </div>
// //   );
// // }
