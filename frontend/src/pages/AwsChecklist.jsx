import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AwsChecklist.css';

const AwsChecklist = ({ token }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const appsPerPage = 10;
    const [showMore, setShowMore] = useState(false);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [levelsData, setLevelsData] = useState({});
    const [controlAreasData, setControlAreasData] = useState({});
    const [controlsData, setControlsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const applicationsResponse = await fetch('http://127.0.0.1:5000/api/applications', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const applications = await applicationsResponse.json();

                const selectionsResponse = await fetch('http://127.0.0.1:5000/api/get-selections', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const selectionsText = await selectionsResponse.text();
                const sanitizedSelectionsText = selectionsText.replace(/NaN/g, 'null');
                const selectionsData = JSON.parse(sanitizedSelectionsText);
                const selectionsList = selectionsData.selections || [];

                const initialData = applications.map(app => {
                    const selection = selectionsList.find(sel => sel.app === app);
                    return {
                        appName: app,
                        selectedType: selection ? selection.type : '',
                        selectedControlArea: selection && selection.control_area ? selection.control_area : 'N/A',
                        layer2Controls: [],
                        awsControls: [],
                        awsSubControls: [],
                    };
                });

                setData(initialData);
                setFilteredData(initialData);
                await loadDynamicData(initialData);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    useEffect(() => {
        const filteredApps = data.filter(item => item.appName.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredData(filteredApps);
    }, [searchTerm, data]);

    const loadDynamicData = async (apps) => {
        const updatedData = [...apps];
        for (let index = 0; index < updatedData.length; index++) {
            const item = updatedData[index];
            const { selectedType, selectedControlArea } = item;

            if (selectedType) {
                try {
                    const levelsResponse = await fetch(`http://127.0.0.1:5000/api/levels?type=${selectedType}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const levels = await levelsResponse.json();
                    setLevelsData(prev => ({ ...prev, [index]: levels }));

                    const controlAreasResponse = await fetch(`http://127.0.0.1:5000/api/control-areas?type=${selectedType}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const controlAreas = await controlAreasResponse.json();
                    setControlAreasData(prev => ({ ...prev, [index]: controlAreas }));

                    if (selectedControlArea) {
                        const controlsResponse = await fetch(`http://127.0.0.1:5000/api/controls?control_area=${selectedControlArea}&type=${selectedType}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        const controls = await controlsResponse.json();
                        setControlsData(prev => ({ ...prev, [index]: controls }));
                    }
                } catch (error) {
                    console.error(`Error fetching dynamic data for ${selectedType}:`, error);
                }
            }
        }
    };


    const handleTypeChange = async (index, type) => {
        const updatedData = [...data];
        updatedData[index].selectedType = type;
        setData(updatedData);
        await loadDynamicData(updatedData);
        await sendDataToBackend(index);
    };

    const handleControlAreaChange = async (index, controlArea) => {
        const updatedData = [...data];
        const selectedType = updatedData[index].selectedType;
        updatedData[index].selectedControlArea = controlArea;
        setData(updatedData);

        const controlsResponse = await fetch(`http://127.0.0.1:5000/api/controls?control_area=${controlArea}&type=${selectedType}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const controls = await controlsResponse.json();
        setControlsData(prev => ({ ...prev, [index]: controls }));
        await sendDataToBackend(index);
    };

    const sendDataToBackend = async (index) => {
        const appData = data[index];
        const payload = {
            appName: appData.appName,
            selectedType: appData.selectedType,
            selectedControlArea: appData.selectedControlArea || '',
        };
        await fetch('http://127.0.0.1:5000/api/store-selections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    };

    const indexOfLastApp = currentPage * appsPerPage;
    const indexOfFirstApp = indexOfLastApp - appsPerPage;
    const currentApps = filteredData.slice(indexOfFirstApp, indexOfLastApp);
    const totalPages = Math.ceil(filteredData.length / appsPerPage);

    return (
        <main className="main-content">
            <h1>AWS Security Checklist</h1>
            <input
                type="text"
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
            />
            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && (
                <div className="table-container">
                    <table className="checklist-table">
                        <thead>
                            <tr>
                                <th>App Name</th>
                                <th>Type</th>
                                <th>Level</th>
                                <th>Control Area</th>
                                <th>Layer 2 Controls (Generic)</th>
                                {showMore && (
                                    <>
                                        <th>AWS Controls</th>
                                        <th>AWS Sub-Controls</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentApps.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.appName}</td>
                                    <td>
                                        <select value={item.selectedType} onChange={(e) => handleTypeChange(index, e.target.value)}>
                                            <option value="" disabled>Select Type</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </td>
                                    <td>{item.selectedType ? (levelsData[index] ? levelsData[index].join(', ') : 'Loading...') : 'N/A'}</td>
                                    <td>
                                        <select value={item.selectedControlArea} onChange={(e) => handleControlAreaChange(index, e.target.value)} disabled={!item.selectedType}>
                                            <option value="" disabled>Select Control Area</option>
                                            {controlAreasData[index] && controlAreasData[index].map((area, idx) => (
                                                <option key={idx} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{item.selectedControlArea ? (controlsData[index]?.layer2_controls?.join(', ') || 'Loading...') : 'N/A'}</td>
                                    {showMore && (
                                        <>
                                            <td>{item.selectedControlArea ? (controlsData[index]?.aws_controls?.join(', ') || 'Loading...') : 'N/A'}</td>
                                            <td>{item.selectedControlArea ? (controlsData[index]?.aws_sub_controls?.join(', ') || 'Loading...') : 'N/A'}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={() => setShowMore(prev => !prev)}>
                        {showMore ? 'Show Less' : 'Show More'}
                    </button>
                    <div className="pagination">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AwsChecklist;
