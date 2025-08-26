import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppContextProvider = ({ children }) => {
  const [people, setPeople] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  
  // Load saved data from localStorage on initial render
  useEffect(() => {
    // Check both 'savedPeople' and 'meetingPeople' for backward compatibility
    const savedPeople = JSON.parse(localStorage.getItem('savedPeople')) || [];
    const meetingPeople = JSON.parse(localStorage.getItem('meetingPeople')) || [];
    
    // Combine both lists and remove duplicates
    const combinedPeople = [...new Set([...savedPeople, ...meetingPeople])];
    setPeople(combinedPeople);
    
    const savedMeetings = JSON.parse(localStorage.getItem('savedMeetings')) || [];
    setMeetings(savedMeetings);
    
    const currentMeetingInfo = JSON.parse(localStorage.getItem('currentMeetingInfo'));
    setCurrentMeeting(currentMeetingInfo);
  }, []);
  
  // Save people to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('savedPeople', JSON.stringify(people));
  }, [people]);
  
  // Save meetings to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('savedMeetings', JSON.stringify(meetings));
  }, [meetings]);
  
  // Save current meeting to localStorage whenever it changes
  useEffect(() => {
    if (currentMeeting) {
      localStorage.setItem('currentMeetingInfo', JSON.stringify(currentMeeting));
    }
  }, [currentMeeting]);
  
  // Context value
  const value = {
    people,
    setPeople,
    meetings,
    setMeetings,
    currentMeeting,
    setCurrentMeeting,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
