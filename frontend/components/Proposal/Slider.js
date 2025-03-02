import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

const ProposalSlider = ({ onRadiusChange }) => {
    const [radius, setRadius] = useState(50);

    const handleChange = (event, value) => {
        setRadius(value);
        onRadiusChange(value); // Call the passed function to update the radius in the parent
    };

    return (
        <div>
            <Typography id="proposal-slider" gutterBottom>
                Proposal Radius (km): {radius}
            </Typography>
            <Slider
                aria-labelledby="proposal-slider"
                value={radius}
                step={1}
                marks
                min={0}
                max={100}
                onChange={handleChange}
            />
        </div>
    );
};

export default ProposalSlider;
