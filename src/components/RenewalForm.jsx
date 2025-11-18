import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs'; 
import customParseFormat from 'dayjs/plugin/customParseFormat';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// NOTE: We assume your frontend is running on a different port (e.g., 3000)
dayjs.extend(customParseFormat);

const RenewalForm = () => {
    const { id } = useParams(); // Gets the internal 'id' from the URL
    const navigate = useNavigate();
    
    // State for the form inputs
    const [newDateTo, setNewDateTo] = useState('');
    const [newTimeIn, setNewTimeIn] = useState('');
    const [reason, setReason] = useState('');
    
    // State for status/loading
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true); // Start loading for initial fetch

    // 💡 NEW States for fetched data and time comparison
    const [outpassData, setOutpassData] = useState(null);
    const [existingEndTime, setExistingEndTime] = useState(null);
    
    // DEDICATED FETCH FUNCTION: Gets existing details for display and validation
    const fetchOutpassDetails = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(`${API_BASE_URL}/outpass-route/getinfo/outpass/${id}`); 
            const data = response.data;
            
            setOutpassData(data);

            const existingDate = dayjs(data.date_to).format('YYYY-MM-DD'); 
            
            // 2. Get the Time part (HH:MM:SS) from the time_in string.
            const timeString = data.time_in; // e.g., "17:26:00"
            
            // 3. Combine them into a clean string
            const fullDateTimeString = `${existingDate} ${timeString}`; 
            
            // 4. Parse using explicit format and local flag to force correct time
            const formatString = 'YYYY-MM-DD HH:mm:ss';
            const existingEnd = dayjs(fullDateTimeString, formatString, true); 
            
            if (!existingEnd.isValid()) {
                console.error("CRITICAL PARSING ERROR. Raw data:", data.date_to, data.time_in);
                setExistingEndTime(null);
            } else {
                setExistingEndTime(existingEnd); 
                console.log("Parsed Existing End Time:", existingEnd.format('MMM D, YYYY [at] h:mm A'));
            }

            setMessage(`Submitting renewal for Outpass ID: ${data.hostel_id}`);
        } catch (error) {
            console.error('Fetch Details Error:', error);
            setMessage(`❌ Failed to load outpass details (ID: ${id}): ${error.response?.data?.message || error.message}. Check if ID is valid.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutpassDetails();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Basic validation
        if (!newDateTo || !newTimeIn || !reason) {
            setMessage('❌ Please fill in all fields (New Date, New Time, and Reason).');
            setLoading(false);
            return;
        }

        // 💡 CRITICAL TIME CHECK: New check-in must be later than the existing one
        const requestedEndTime = dayjs(`${newDateTo} ${newTimeIn}`);
        
        if (!existingEndTime || requestedEndTime.isSame(existingEndTime) || requestedEndTime.isBefore(existingEndTime)) {
            const currentEndStr = existingEndTime ? existingEndTime.format('MMM D, YYYY [at] h:mm A') : 'N/A';
            setMessage(`❌ Renewal failed: The requested check-in time (${requestedEndTime.format('MMM D, YYYY [at] h:mm A')}) must be **strictly later** than the current approved check-in time (${currentEndStr}).`);
            setLoading(false);
            return;
        }
        // Ensure the data format sent is correct (YYYY-MM-DD and HH:MM)
        // newDateTo and newTimeIn are already in the correct format from HTML input type="date/time"

        try {
            // The actual POST request to the backend renewal endpoint
            const response = await axios.post(`${API_BASE_URL}/outpass-route/renew/${id}`, {
                new_date_to: newDateTo, // YYYY-MM-DD
                new_time_in: newTimeIn, // HH:MM
                renewal_reason: reason, // Text
            });

            setMessage(`✅ Request submitted successfully!`);
            
            // // Redirect after successful submission
            // setTimeout(() => {
            //     navigate('/outpass/list'); 
            // }, 3000);

        } catch (error) {
            console.error('Renewal Error:', error);
            setMessage(`❌ Renewal failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={styles.container}><h3 style={{textAlign: 'center', color: ACCENT_COLOR}}>Loading Outpass Details...</h3></div>;
    }
    
    // This check is important if the outpass details couldn't be loaded (e.g., invalid ID)
    if (!outpassData) {
        return <div style={styles.container}><h3 style={styles.errorMessage}>Could not load outpass data. Please check the URL.</h3><p style={{textAlign: 'center'}}>{message}</p></div>;
    }


    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Outpass Renewal Request</h2>
            
            {/* 💡 Display hostel_id instead of internal ID */}
            <p style={styles.subHeader}>
                Please enter the new required check-in time for Outpass **#{outpassData.hostel_id}**
            </p>
            
            {/* Display Current Check-in time for context */}
            {existingEndTime && existingEndTime.isValid() ? (
                <p style={{textAlign: 'center', marginBottom: 20, color: '#f55d00', fontWeight: 'bold', borderBottom: '1px dashed #ddd', paddingBottom: 10}}>
                    Current Check-In: {existingEndTime.format('MMM D, YYYY [at] h:mm A')}
                </p>
            ) : (
                 <p style={{textAlign: 'center', marginBottom: 20, color: 'red', fontWeight: 'bold', borderBottom: '1px dashed #ddd', paddingBottom: 10}}>
                    Current Check-In: Invalid Date or Data Missing
                </p>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label htmlFor="newDate" style={styles.label}>New Check-In Date:</label>
                    <input 
                        type="date" 
                        id="newDate"
                        value={newDateTo}
                        onChange={(e) => setNewDateTo(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="newTime" style={styles.label}>New Check-In Time:</label>
                    <input 
                        type="time" 
                        id="newTime"
                        value={newTimeIn}
                        onChange={(e) => setNewTimeIn(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="reason" style={styles.label}>Reason for Renewal:</label>
                    <textarea 
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        rows="4"
                        style={styles.textarea}
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    disabled={loading} 
                    style={styles.button}
                >
                    {loading ? 'Submitting...' : 'Submit Renewal Request'}
                </button>
            </form>

            {message && (
                <p style={message.startsWith('✅') ? styles.successMessage : styles.errorMessage}>
                    {message}
                </p>
            )}
        </div>
    );
};

// Simple inline styles (use CSS for a real application)
const ACCENT_COLOR = "#4b3d82";
const styles = {
    container: {
        maxWidth: '500px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    header: {
        color: ACCENT_COLOR,
        textAlign: 'center',
        marginBottom: '10px',
    },
    subHeader: {
        color: '#666',
        textAlign: 'center',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box',
        resize: 'vertical',
    },
    button: {
        padding: '12px 20px',
        backgroundColor: ACCENT_COLOR,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '10px',
    },
    successMessage: {
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e6ffe6',
        border: '1px solid #4CAF50',
        color: '#4CAF50',
        borderRadius: '4px',
        textAlign: 'center',
    },
    errorMessage: {
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#ffe6e6',
        border: '1px solid #f44336',
        color: '#f44336',
        borderRadius: '4px',
        textAlign: 'center',
    }
};

export default RenewalForm;