import React, { useState } from 'react';
import styled from 'styled-components';
import { FiArrowRight } from 'react-icons/fi';

const SearchBarContainer = styled.div`
  margin: 20px 0;
`;

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: none;
  padding: 8px 12px;
  font-size: 16px;
  color: ${props => props.theme.colors.text};
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
    transition: color 0.3s ease;
  }

  &:focus::placeholder {
    color: ${props => props.theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  transform-origin: center;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    background: ${props => props.theme.colors.primaryHover};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover:not(:disabled) svg {
    transform: translateX(2px);
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 14px;
  margin-top: 8px;
  padding-left: 12px;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SearchBar = ({ onSubmit, error }) => {
  const [url, setUrl] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setUrl(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <SearchBarContainer>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={url}
          onChange={handleChange}
          placeholder="Enter website URL (e.g. google.com)"
        />
        <SearchButton type="submit" disabled={!url.trim()}>
          <FiArrowRight />
        </SearchButton>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SearchBarContainer>
  );
};

export default SearchBar;
