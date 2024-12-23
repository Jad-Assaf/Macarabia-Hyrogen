import {Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen-react';
import React, {useRef} from 'react';
import '../styles/HomeSlider.css';

export const CategorySlider = ({sliderCollections}) => {
  return (
    <div className="slide-con">
      <h3 className="cat-h3">Shop By Categories</h3>
      <div className="category-slider">
        {sliderCollections.map((collection, index) => (
          <CategoryItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

const svgs = [
  `<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100px" height="100px" viewBox="0 0 115.383 115.383" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M11.025,87.78h93.333c1.931,0,3.5-1.57,3.5-3.5v-60c0-1.93-1.569-3.5-3.5-3.5H11.025c-1.93,0-3.5,1.57-3.5,3.5v60 C7.525,86.21,9.096,87.78,11.025,87.78z M10.525,24.28c0-0.276,0.224-0.5,0.5-0.5h93.333c0.276,0,0.5,0.224,0.5,0.5v60 c0,0.276-0.224,0.5-0.5,0.5H11.025c-0.276,0-0.5-0.224-0.5-0.5V24.28z M115.383,90.458v2.801c0,0.742-0.602,1.344-1.344,1.344 H1.344C0.602,94.603,0,94.001,0,93.259v-2.801h47.387c0.234,0.781,0.95,1.354,1.807,1.354h16.996c0.856,0,1.572-0.572,1.807-1.354 H115.383z"></path> </g> </g></svg>`,
  `<svg fill="#000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100px" height="100px" viewBox="0 0 105.48 105.48" xml:space="preserve" stroke="#000" stroke-width="0.00105477"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M8.44,33.65h6.845v70.884l-13.921-0.022l7.076-6.287V33.65z M8.44,31.196l6.845,0.009V0H8.44V31.196z M40.48,95.174 c-0.187,1.701-0.271,3.352-0.251,4.906c0.019,1.37,0.195,2.887,1.02,4.443l-23.873,0.011V33.65l6.161,0.5l41.271,8.49v25.148 c-0.189,0.129-0.377,0.263-0.547,0.416h-2.904c-0.404-0.437-0.917-0.786-1.512-1.011c-2.941-1.115-6.021-1.069-8.923,0.117 c-0.463,0.188-0.886,0.431-1.243,0.709c-0.313,0.242-0.586,0.525-0.809,0.838c-0.277,0.227-0.572,0.52-0.83,0.896 c-0.438,0.638-0.861,1.282-1.285,1.929l-0.502,0.762c-1.059,1.601-1.641,3.289-2.029,4.582c-0.805,2.675-1.527,5.595-2.21,8.927 C41.458,88.665,40.84,91.883,40.48,95.174z M20.72,88.286c0,0.041,0.019,0.056,0.063,0.067c0.234,0.063,0.47,0.131,0.705,0.195 c0.07,0.02,0.141,0.039,0.211,0.064c0.196,0.072,0.381,0.236,0.377,0.457c-0.007,0.644-0.002,1.289-0.002,1.935 c0,0.069,0.001,0.14,0.01,0.21c0.027,0.223,0.133,0.426,0.365,0.598c0.161,0.119,0.336,0.184,0.518,0.222 c0.381,0.083,0.667-0.097,0.667-0.418c0-0.978,0-1.954,0-2.931c0-0.02,0-0.039,0-0.065c-0.082-0.022-0.153-0.039-0.226-0.063 c-0.059-0.02-0.072-0.004-0.072,0.043c0.002,0.522,0.002,1.045,0.002,1.568c0,0.366,0,0.732,0,1.098 c-0.001,0.182-0.104,0.271-0.311,0.248c-0.088-0.009-0.184-0.033-0.273-0.066c-0.252-0.1-0.365-0.247-0.365-0.461 c0-0.696-0.006-1.396,0.002-2.092c0.005-0.348-0.308-0.678-0.682-0.801c-0.311-0.102-0.622-0.18-0.933-0.27 c-0.04-0.012-0.056-0.004-0.055,0.031C20.723,88,20.724,88.143,20.72,88.286z M20.722,92.238c0.001,0.146,0.035,0.297,0.133,0.447 c0.149,0.23,0.371,0.371,0.631,0.444c0.447,0.128,0.894,0.249,1.34,0.374c0.057,0.018,0.113,0.036,0.17,0.059 c0.168,0.065,0.291,0.188,0.326,0.324c0.012,0.045,0.015,0.09,0.015,0.133c0.001,0.446,0.001,0.895,0.001,1.342 c0,0.011-0.005,0.023,0.001,0.033c0.01,0.017,0.025,0.041,0.04,0.045c0.081,0.026,0.164,0.049,0.255,0.074c0-0.02,0-0.029,0-0.041 c0-0.563,0.005-1.123-0.003-1.688c-0.003-0.188-0.102-0.375-0.286-0.541c-0.14-0.124-0.299-0.203-0.47-0.25 c-0.459-0.13-0.92-0.255-1.38-0.386c-0.27-0.076-0.468-0.241-0.462-0.514c0.011-0.464,0.004-0.933,0.004-1.398 c0-0.014-0.002-0.023,0-0.035c0.002-0.03-0.012-0.049-0.051-0.059c-0.068-0.018-0.137-0.035-0.206-0.057 c-0.047-0.016-0.06-0.003-0.059,0.034C20.722,91.135,20.72,91.686,20.722,92.238z M23.634,97.702 c0.009-0.099-0.037-0.192-0.097-0.29c-0.179-0.294-0.358-0.588-0.537-0.881c-0.532-0.875-1.065-1.75-1.598-2.623 c-0.028-0.045-0.061-0.092-0.099-0.131c-0.107-0.11-0.223-0.11-0.254,0c-0.012,0.043-0.014,0.09-0.014,0.138 c-0.001,0.892-0.001,1.78,0,2.672c0,0.04-0.014,0.052-0.063,0.035c-0.08-0.024-0.16-0.046-0.245-0.069c0,0.178,0,0.35,0,0.527 c0.082,0.021,0.159,0.047,0.238,0.064c0.054,0.014,0.071,0.033,0.069,0.08c-0.003,0.137-0.002,0.277,0,0.42 c0.001,0.016,0.017,0.047,0.025,0.051c0.094,0.029,0.187,0.054,0.283,0.08c0.002-0.023,0.004-0.041,0.004-0.06 c0-0.133,0.002-0.266-0.002-0.399c0-0.051,0.014-0.063,0.075-0.045c0.63,0.178,1.261,0.354,1.891,0.526 c0.062,0.017,0.126,0.027,0.185,0.028C23.592,97.83,23.628,97.783,23.634,97.702z M21.412,94.436 c-0.012-0.019-0.025-0.033-0.038-0.051c-0.007,0-0.013,0-0.019,0c0,0.78,0,1.561,0,2.342c0.018,0.006,0.029,0.01,0.04,0.014 c0.542,0.15,1.085,0.302,1.627,0.453c0.067,0.019,0.075,0.007,0.038-0.055C22.511,96.236,21.961,95.335,21.412,94.436z M64.806,40.653V13.448L24.463,0h-7.087v31.206l6.394,0.557L64.806,40.653z M56.732,81.413l-1.308-1.429 c-0.125-0.135-0.322-0.135-0.445,0l-1.201,1.312c-0.23,0.202-0.384,0.532-0.384,0.83v2.51c0,0.471,0.381,0.854,0.852,0.854h1.902 c0.471,0,0.853-0.383,0.853-0.854v-2.51c0-0.246-0.104-0.514-0.271-0.714H56.732z M54.542,79.016l-1.431-1.31v0.003 c-0.199-0.166-0.467-0.271-0.713-0.271h-2.511c-0.47,0-0.851,0.383-0.851,0.853v1.903c0,0.471,0.381,0.852,0.851,0.852h2.511 c0.298,0,0.627-0.152,0.83-0.385l1.313-1.201C54.677,79.336,54.677,79.137,54.542,79.016z M67.524,78.79h12.955 c0.642,0,1.165-0.522,1.165-1.167v-0.016v-6.715v-0.035c0-0.644-0.523-1.166-1.164-1.166H67.525c-0.644,0-1.166,0.522-1.166,1.166 v0.016v6.716v0.034C66.359,78.266,66.884,78.79,67.524,78.79z M54.979,78.773c0.123,0.135,0.32,0.135,0.445,0l1.308-1.43h-0.003 c0.167-0.199,0.271-0.468,0.271-0.713v-2.512c0-0.471-0.382-0.852-0.853-0.852h-1.902c-0.471,0-0.853,0.381-0.853,0.852v2.512 c0,0.297,0.152,0.627,0.385,0.829L54.979,78.773z M97.244,77.146c1.097,0,1.981,0.889,1.981,1.982s-0.887,1.982-1.981,1.982 c-1.094,0-1.981-0.889-1.981-1.982S96.15,77.146,97.244,77.146z M97.244,77.809c-0.715,0-1.297,0.58-1.297,1.295 c0,0.717,0.582,1.299,1.297,1.299c0.718,0,1.3-0.582,1.3-1.299C98.544,78.389,97.962,77.809,97.244,77.809z M91.858,75.543h1.9 l-0.951-1.609L91.858,75.543z M94.792,74.857c0,1.097-0.888,1.982-1.982,1.982c-1.094,0-1.982-0.887-1.982-1.982 c0-1.094,0.889-1.981,1.982-1.981C93.904,72.875,94.792,73.764,94.792,74.857z M94.189,75.789l-1.382-2.336l-1.379,2.336H94.189z M96.192,79.104c0,0.582,0.472,1.055,1.052,1.055c0.581,0,1.054-0.473,1.054-1.055c0-0.578-0.473-1.051-1.054-1.051 C96.664,78.053,96.192,78.525,96.192,79.104z M94.792,83.408c0,1.095-0.888,1.982-1.982,1.982c-1.094,0-1.982-0.889-1.982-1.982 s0.889-1.982,1.982-1.982C93.904,81.425,94.792,82.312,94.792,83.408z M93.087,83.408l0.93-0.93l-0.225-0.227l-0.931,0.93 l-0.931-0.93l-0.226,0.227l0.931,0.93l-0.931,0.93l0.226,0.227l0.931-0.93l0.931,0.93l0.225-0.227L93.087,83.408z M104.109,99.243 c-0.024,1.969-0.458,3.321-2.367,4.894c-3.33,2.573-7.83,0.895-8.782-0.513c-0.953-1.407-1.765-3.593-2.41-5.491 c-0.527-1.545-1.056-3.09-1.569-4.64c-0.165-0.494-0.577-0.679-0.996-0.863c-0.052-0.021-0.151,0.026-0.21,0.07 c-2.297,1.673-5.205,1.62-7.443-0.125c-0.113-0.089-0.285-0.15-0.43-0.15c-0.66,0-2.363,0.003-4.035,0.005v0.008 c-0.365-0.002-1.051-0.002-1.873-0.004c-0.822,0.002-1.507,0.002-1.873,0.004V92.43c-1.672-0.002-3.374-0.005-4.035-0.005 c-0.145,0-0.314,0.062-0.43,0.15c-2.238,1.745-5.146,1.798-7.443,0.125c-0.059-0.044-0.158-0.093-0.209-0.07 c-0.418,0.185-0.832,0.369-0.996,0.863c-0.516,1.55-1.043,3.095-1.567,4.64c-0.647,1.898-1.459,4.086-2.412,5.491 c-0.952,1.405-5.451,3.086-8.783,0.513c-1.908-1.57-2.341-2.925-2.367-4.894c-0.019-1.493,0.068-2.995,0.23-4.479 c0.328-2.992,0.879-5.953,1.482-8.902c0.594-2.9,1.279-5.781,2.133-8.619c0.387-1.284,0.852-2.533,1.598-3.661 c0.583-0.881,1.155-1.769,1.753-2.64c0.109-0.158,0.306-0.271,0.483-0.369c0.135-0.074,0.234-0.129,0.244-0.307 c0.006-0.096,0.086-0.207,0.166-0.269c0.124-0.097,0.271-0.175,0.418-0.233c2.109-0.863,4.23-0.898,6.365-0.09 c0.182,0.068,0.284,0.191,0.268,0.381c-0.026,0.293,0.086,0.455,0.384,0.481c0.022,0.002,0.047,0.014,0.067,0.024 c0.502,0.26,1.043,0.35,1.603,0.352h4.741l-0.016,6.71c0,0.955,0.775,1.731,1.729,1.731H80.48c0.954,0,1.729-0.776,1.729-1.731 v-6.71h4.707c0.561-0.002,1.1-0.092,1.604-0.352c0.02-0.012,0.043-0.022,0.066-0.024c0.297-0.026,0.41-0.188,0.385-0.481 c-0.019-0.189,0.084-0.312,0.266-0.381c2.135-0.811,4.256-0.773,6.365,0.09c0.148,0.061,0.294,0.137,0.418,0.233 c0.08,0.062,0.16,0.173,0.166,0.269c0.01,0.178,0.109,0.231,0.244,0.307c0.178,0.099,0.375,0.211,0.483,0.369 c0.599,0.871,1.171,1.759,1.752,2.64c0.746,1.128,1.212,2.377,1.599,3.661c0.854,2.838,1.539,5.719,2.133,8.619 c0.604,2.949,1.154,5.91,1.482,8.902C104.042,96.248,104.13,97.75,104.109,99.243z M62.552,75.475c0,0.672,0.543,1.217,1.215,1.217 s1.217-0.545,1.217-1.217v-2.502c0-0.672-0.545-1.217-1.217-1.217s-1.215,0.544-1.215,1.217V75.475z M62.05,79.247 c0-3.763-3.052-6.813-6.813-6.813c-3.762,0-6.812,3.051-6.812,6.813s3.05,6.812,6.812,6.812 C58.998,86.059,62.05,83.008,62.05,79.247z M67.527,89.314c0-1.955-1.585-3.539-3.54-3.539c-1.954,0-3.54,1.584-3.54,3.539 s1.586,3.539,3.54,3.539C65.942,92.854,67.527,91.27,67.527,89.314z M73.779,89.389c0.067,0,0.138,0,0.205-0.007 c0.209-0.024,0.381-0.11,0.485-0.302c0.072-0.133,0.086-0.279,0.076-0.43c-0.023-0.314-0.279-0.553-0.594-0.553 c-0.959,0-1.918,0-2.877,0c-0.02,0-0.039,0-0.064,0c0,0.069,0.004,0.129-0.002,0.188c-0.002,0.047,0.017,0.06,0.063,0.06 c0.513-0.002,1.024-0.002,1.539-0.002c0.358,0,0.719,0,1.078,0c0.179,0,0.293,0.086,0.327,0.256 c0.017,0.073,0.02,0.152,0.009,0.228c-0.027,0.208-0.142,0.303-0.353,0.303c-0.684,0-1.369,0.005-2.055-0.003 c-0.342-0.003-0.58,0.256-0.599,0.564c-0.015,0.256-0.007,0.515-0.009,0.771c-0.002,0.033,0.01,0.046,0.045,0.046 c0.141-0.001,0.281-0.003,0.423,0c0.04,0.002,0.049-0.016,0.049-0.051c-0.001-0.193-0.001-0.391,0-0.584 c0-0.059,0-0.116,0.007-0.174c0.018-0.162,0.127-0.314,0.346-0.312C72.513,89.395,73.146,89.391,73.779,89.389z M77.779,88.1 c-0.019,0-0.028,0-0.039,0c-0.553,0-1.104-0.004-1.655,0.002c-0.185,0.004-0.343,0.084-0.453,0.236 c-0.084,0.116-0.117,0.248-0.117,0.389c-0.002,0.381,0.002,0.762-0.002,1.144c-0.002,0.224-0.109,0.386-0.377,0.381 c-0.459-0.008-0.918-0.002-1.375-0.002c-0.013,0-0.023,0.001-0.035,0c-0.03-0.003-0.043,0.011-0.043,0.042 c0.002,0.057,0.002,0.113,0,0.17c-0.002,0.038,0.014,0.049,0.051,0.049c0.543,0,1.086,0,1.629,0c0.143,0,0.279-0.031,0.4-0.109 c0.188-0.125,0.264-0.309,0.266-0.523c0.004-0.369,0-0.738,0.001-1.107c0.001-0.047,0.004-0.094,0.011-0.141 c0.018-0.139,0.105-0.24,0.229-0.27c0.041-0.012,0.084-0.014,0.127-0.014c0.438,0,0.877,0,1.316,0c0.01,0,0.023,0.004,0.032,0 c0.015-0.01,0.033-0.021,0.033-0.033C77.781,88.244,77.779,88.176,77.779,88.1z M83.003,75.475c0,0.672,0.545,1.217,1.217,1.217 s1.217-0.545,1.217-1.217v-2.502c0-0.672-0.545-1.217-1.217-1.217s-1.217,0.544-1.217,1.217V75.475z M87.537,89.314 c0-1.955-1.585-3.539-3.539-3.539s-3.54,1.584-3.54,3.539s1.586,3.539,3.54,3.539S87.537,91.27,87.537,89.314z M99.56,79.247 c0-3.763-3.051-6.813-6.812-6.813s-6.812,3.051-6.812,6.813s3.051,6.812,6.812,6.812S99.56,83.008,99.56,79.247z M90.49,79.129 c0,1.096-0.89,1.982-1.981,1.982c-1.097,0-1.983-0.889-1.983-1.982s0.888-1.982,1.983-1.982 C89.601,77.146,90.49,78.035,90.49,79.129z M89.587,78.027h-2.158v2.156h2.158V78.027z M60.404,77.439h-2.511 c-0.245,0-0.514,0.104-0.713,0.271v-0.003l-1.43,1.309c-0.135,0.123-0.135,0.321,0,0.444l1.313,1.201 c0.202,0.231,0.53,0.385,0.829,0.385h2.511c0.472,0,0.853-0.381,0.853-0.853v-1.902C61.257,77.82,60.876,77.439,60.404,77.439z M89.341,78.27h-1.668v1.67h1.668V78.27z"></path> </g> </g></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="101.0286 214.3239 267.1187 230.3592" width="267.119px" height="230.359px"><g data-name="Layer 2" id="Layer_2" transform="matrix(9.608445167541504, 0, 0, 9.608445167541504, 80.98267831035275, 175.89643969869928)"><path d="M 24.701 27.968 L 3.733 27.974 C 2.199 27.965 1.667 27.322 2.434 25.993 L 5.85 20 C 6.209 19.379 6.873 19.922 7.59 19.925 L 24.42 19.925 C 25.137 19.922 25.801 19.379 26.16 20 L 29.363 25.723 C 30.132 27.056 30.181 27.895 28.642 27.897 L 24.701 27.968 Z M 3.437 26.697 L 28.472 26.701 L 25.379 21.061 L 6.765 21 L 3.437 26.697 Z" style="stroke-linecap: square; stroke-miterlimit: 2.46; stroke-width: 0.104075px; stroke: rgb(255, 255, 255);"/><path d="M 25 21 L 7 21 C 6.448 21 6 20.552 6 20 L 6 5.042 C 6 3.937 6.122 4 7.227 4 L 24.88 4.036 C 25.985 4.036 26 3.821 26 4.925 L 26 20 C 26 20.552 25.552 21 25 21 Z M 7.079 19.941 L 24.961 19.941 L 24.961 5.123 L 7.07 5.123 L 7.079 19.941 Z" style="stroke-linecap: square; stroke-miterlimit: 2.46; stroke-width: 0.104075px; stroke: rgb(255, 255, 255);"/><path d="M18,25H14a1,1,0,0,1,0-2h4a1,1,0,0,1,0,2Z" style="stroke-linecap: square; stroke-miterlimit: 2.46; stroke-width: 0.104075px; stroke: rgb(255, 255, 255);"/></g></svg>`,
  `<svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:none;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} .st1{fill:none;stroke:#000000;stroke-width:1;stroke-linejoin:round;stroke-miterlimit:10;} </style> <rect x="3" y="13" class="st0" width="13" height="9"></rect> <line class="st0" x1="6" y1="26" x2="13" y2="26"></line> <rect x="19" y="6" class="st0" width="10" height="20"></rect> <line class="st0" x1="19" y1="17" x2="29" y2="17"></line> <line class="st0" x1="22" y1="10" x2="26" y2="10"></line> <line class="st0" x1="25" y1="13" x2="26" y2="13"></line> </g></svg>`,
  `<svg fill="#000000" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 431.908 431.908" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M423.908,152.051c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006v-31.936h24.006c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006 V71.996c0-22.056-17.944-40-40-40h-16.109V8c0-4.418-3.582-8-8-8s-8,3.582-8,8v23.996h-31.937V8c0-4.418-3.582-8-8-8s-8,3.582-8,8 v23.996H247.92V8c0-4.418-3.582-8-8-8s-8,3.582-8,8v23.996h-31.935V8c0-4.418-3.582-8-8-8s-8,3.582-8,8v23.996h-31.936V8 c0-4.418-3.582-8-8-8s-8,3.582-8,8v23.996h-31.936V8c0-4.418-3.582-8-8-8s-8,3.582-8,8v23.996H71.985c-22.056,0-40,17.944-40,40 v16.119H8c-4.418,0-8,3.582-8,8s3.582,8,8,8h23.985v31.936H8c-4.418,0-8,3.582-8,8s3.582,8,8,8h23.985v31.936H8 c-4.418,0-8,3.582-8,8s3.582,8,8,8h23.985v31.935H8c-4.418,0-8,3.582-8,8s3.582,8,8,8h23.985v31.936H8c-4.418,0-8,3.582-8,8 s3.582,8,8,8h23.985v31.936H8c-4.418,0-8,3.582-8,8s3.582,8,8,8h23.985v16.119c0,22.056,17.944,40,40,40h16.128v23.995 c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h31.936v23.995c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h31.936v23.995 c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h31.935v23.995c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h31.936v23.995 c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h31.937v23.995c0,4.418,3.582,8,8,8s8-3.582,8-8v-23.995h16.109c22.056,0,40-17.944,40-40 v-16.119h24.006c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006v-31.936h24.006c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006v-31.936 h24.006c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006v-31.935h24.006c4.418,0,8-3.582,8-8s-3.582-8-8-8h-24.006v-31.936H423.908z M383.902,359.912c0,13.233-10.767,24-24,24H71.985c-13.233,0-24-10.767-24-24V71.996c0-13.234,10.767-24,24-24h287.917 c13.233,0,24,10.766,24,24V359.912z"></path> <path d="M343.777,72.121H88.11c-8.822,0-16,7.177-16,16v255.667c0,8.822,7.178,16,16,16h255.667c8.822,0,16-7.178,16-16V88.121 C359.777,79.298,352.599,72.121,343.777,72.121z M88.11,343.787V88.121h255.667l0.002,255.667H88.11z"></path> </g> </g></svg>`,
  `<svg fill="#000000" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M165.84619,163.1875a3.99976,3.99976,0,1,1-5.56348,5.74805,46.77825,46.77825,0,0,0-64.581,0,3.99976,3.99976,0,1,1-5.56348-5.74805,54.7759,54.7759,0,0,1,75.708,0Zm-37.854-63.18457A101.76273,101.76273,0,0,0,56.17334,129.269a4.00005,4.00005,0,1,0,5.61035,5.70313,94.75433,94.75433,0,0,1,132.417,0A4.00006,4.00006,0,0,0,199.811,129.269,101.76276,101.76276,0,0,0,127.99219,100.00293Zm105.74121-4.667a150.68135,150.68135,0,0,0-211.48242,0,4,4,0,1,0,5.626,5.6875,142.68158,142.68158,0,0,1,200.23047,0,4,4,0,1,0,5.626-5.6875ZM128,192a8,8,0,1,0,8,8A8.00917,8.00917,0,0,0,128,192Z"></path> </g></svg>`,
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M0 4v14a1.001 1.001 0 0 0 1 1h9v1H8v1h8v-1h-2v-1h9a1.001 1.001 0 0 0 1-1V4a1.001 1.001 0 0 0-1-1H1a1.001 1.001 0 0 0-1 1zm13 16h-2v-1h2zm10-2H1V4h22z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="282.7037 217.3658 17.5177 29.5" width="17.5177px" height="29.5px"><path d="M 23.077 1.25 L 8.498 1.254 C 6.98 1.256 7.252 1.859 7.25 3.377 L 7.25 28.897 C 7.252 30.415 7.308 30.748 8.826 30.75 L 23.287 30.75 C 24.805 30.748 24.748 30.144 24.75 28.626 L 24.75 3.006 C 24.748 1.488 24.595 1.252 23.077 1.25 Z M 23.25 28.288 C 23.249 28.978 23.153 29.249 22.463 29.25 L 9.527 29.25 C 8.837 29.249 8.751 29.083 8.75 28.393 L 8.75 3.726 C 8.751 3.036 8.768 2.751 9.458 2.75 L 22.382 2.75 C 23.072 2.751 23.249 3.089 23.25 3.779 L 23.25 28.288 Z M 18 25.75 L 14 25.75 C 13.586 25.75 13.25 26.086 13.25 26.5 C 13.25 26.914 13.586 27.25 14 27.25 L 18 27.25 C 18.414 27.25 18.75 26.914 18.75 26.5 C 18.75 26.086 18.414 25.75 18 25.75 Z" transform="matrix(0.9999989278338006, 0, 0, 0.9999989278338006, 275.47147843442684, 216.11575999695833)" /></svg>`,
  `<svg viewBox="-39.15 0 334.851 334.851" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.a{fill:#211715;}.b{fill:#ffffff;}.c{fill:#4d4544;}</style></defs><path class="a" d="M213.387,8.456V2.413l-2.4,2.4q8.753,0,17.507-.013l-2.4-2.4V8.334c0,3.089,4.8,3.094,4.8,0V2.4a2.435,2.435,0,0,0-2.4-2.4q-8.754,0-17.507.013a2.435,2.435,0,0,0-2.4,2.4V8.456c0,3.089,4.8,3.094,4.8,0Z"></path><path class="a" d="M248.376,34.62h5.76l-2.4-2.4q0,8.754.013,17.507l2.4-2.4H248.5c-3.088,0-3.093,4.8,0,4.8h5.651a2.435,2.435,0,0,0,2.4-2.4q0-8.754-.013-17.507a2.435,2.435,0,0,0-2.4-2.4h-5.76c-3.089,0-3.094,4.8,0,4.8Z"></path><path class="a" d="M248.376,65.623h5.76l-2.4-2.4q0,8.753.013,17.507l2.4-2.4H248.5c-3.088,0-3.093,4.8,0,4.8h5.651a2.435,2.435,0,0,0,2.4-2.4q0-8.754-.013-17.507a2.435,2.435,0,0,0-2.4-2.4h-5.76c-3.089,0-3.094,4.8,0,4.8Z"></path><path class="a" d="M250.643,324.384V13.338a8,8,0,0,0-8-8H10.407a8,8,0,0,0-8,8V324.4a7.994,7.994,0,0,0,7.993,8c46.879,0,184.162,0,232.251-.012A8,8,0,0,0,250.643,324.384Z"></path><path class="a" d="M253.043,324.384V14.594a17.934,17.934,0,0,0-.2-3.235c-.921-5.14-5.6-8.393-10.626-8.421-3.563-.019-7.127,0-10.691,0H19.036c-2.858,0-5.723-.059-8.58,0A10.572,10.572,0,0,0,.007,13.415c-.015.708,0,1.418,0,2.126v304.7c0,4.11-.254,8.038,2.9,11.36,2.748,2.9,6.295,3.2,10.035,3.2h68.24l49.514,0,49.039,0,42.1,0,15.851,0c2.67,0,5.663.341,8.219-.523a10.588,10.588,0,0,0,7.145-9.878c.087-3.09-4.714-3.088-4.8,0a5.718,5.718,0,0,1-2.29,4.531,7.2,7.2,0,0,1-4.582,1.069l-7.257,0-17.177,0-42.753,0-48.992,0-48.763,0H17.562c-2.275,0-4.551.018-6.826,0a5.7,5.7,0,0,1-5.929-5.607c-.035-1.973,0-3.95,0-5.923V15.1c0-.582-.011-1.165,0-1.746.059-3.414,2.782-5.6,6.039-5.62,3.533-.016,7.067,0,10.6,0H232.771c3.218,0,6.437-.03,9.654,0a5.7,5.7,0,0,1,5.818,5.7c.011.712,0,1.426,0,2.138V324.384C248.243,327.472,253.043,327.478,253.043,324.384Z"></path><path class="b" d="M239.325,317.078V20.71a4,4,0,0,0-4-4H17.765a4,4,0,0,0-4,4V317.091a4,4,0,0,0,4,4c42.473,0,173.521,0,217.565-.013A4,4,0,0,0,239.325,317.078Z"></path><path class="b" d="M241.325,317.078V23c0-.718.021-1.441,0-2.159a6.146,6.146,0,0,0-6.182-6.134c-3-.082-6.016,0-9.017,0H26.767c-2.948,0-5.911-.085-8.858,0a6.147,6.147,0,0,0-6.144,6.157c-.021.741,0,1.486,0,2.226V311.959a51.594,51.594,0,0,0,.057,5.807A6,6,0,0,0,15.2,322.5a9.715,9.715,0,0,0,4.288.587H127.171l45.553,0,39.755,0,15.2,0,6.4,0a7.985,7.985,0,0,0,4.329-.857,6.18,6.18,0,0,0,2.917-5.143c.13-2.573-3.871-2.566-4,0-.139,2.765-4.092,2-5.99,2H224.4l-16.534,0-40.3,0-45.659,0-44.813,0H23.656a39.548,39.548,0,0,1-6.167-.01,2.087,2.087,0,0,1-1.724-2.147c-.106-2.278,0-4.586,0-6.865V22.686c0-.63-.042-1.277,0-1.906.109-1.6,1.3-2.07,2.642-2.07H227.218c2.658,0,5.39-.182,8.045,0,2.695.186,2.062,3.629,2.062,5.523V317.078C237.325,319.651,241.325,319.656,241.325,317.078Z"></path><circle class="c" cx="126.522" cy="8.855" r="2.666"></circle></g></svg>`,
  `<svg viewBox="-2.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="icomoon-ignore"> </g> <path d="M26.667 14.4c0-7.36-5.973-13.333-13.333-13.333s-13.333 5.973-13.333 13.333v5.44h0.053c0 0.16 0 0.32 0 0.427 0 3.52 2.827 6.4 6.347 6.4v0-12.8h-0.053c-2.24 0-4.16 1.12-5.28 2.88v-2.347c0-6.773 5.493-12.267 12.267-12.267s12.267 5.493 12.267 12.267v2.347c-1.12-1.707-3.093-2.88-5.28-2.88h-0.053v12.8h0.053c0.533 0 1.013-0.053 1.547-0.213-1.6 1.547-3.573 2.613-5.813 3.147v-1.867h-5.387v3.2h5.333v-0.213c3.413-0.693 6.347-2.667 8.267-5.44 1.44-1.173 2.4-2.987 2.4-5.013 0-0.16 0-0.32 0-0.427v0-5.44zM5.333 15.040v10.453c-2.4-0.48-4.267-2.667-4.267-5.227s1.867-4.747 4.267-5.227zM14.933 29.867h-3.2v-1.067h3.2v1.067zM21.333 25.493v-10.453c2.453 0.48 4.267 2.667 4.267 5.227s-1.813 4.747-4.267 5.227z" fill="#000000"> </path> </g></svg>`,
  `<svg fill="#000000" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" transform="rotate(270)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>usb-line</title> <path d="M14.29,11.4a1.49,1.49,0,0,1,1.28-.72h1a2.89,2.89,0,0,0,2.75,2.09,3,3,0,0,0,0-5.91,2.9,2.9,0,0,0-2.67,1.82H15.57a3.49,3.49,0,0,0-3,1.66l-3,4.83h2.36Zm5-2.94A1.36,1.36,0,1,1,18,9.81,1.32,1.32,0,0,1,19.33,8.46Z" class="clr-i-outline clr-i-outline-path-1"></path><path d="M34.3,17.37l-6.11-3.66a.7.7,0,0,0-.7,0,.71.71,0,0,0-.36.61V17H6.92a2.33,2.33,0,0,1,.32,1.17,2.47,2.47,0,1,1-2.47-2.46,2.37,2.37,0,0,1,1.15.3l.93-1.76A4.44,4.44,0,1,0,9.15,19h3.58l4.17,6.65a3.49,3.49,0,0,0,3,1.66h1.66v1.28a.79.79,0,0,0,.8.79h4.49a.79.79,0,0,0,.8-.79v-4.4a.79.79,0,0,0-.8-.8H22.34a.8.8,0,0,0-.8.8v1.12H19.88a1.51,1.51,0,0,1-1.28-.72L15.09,19h12v2.66a.69.69,0,0,0,.36.61.67.67,0,0,0,.34.09.65.65,0,0,0,.36-.1l6.11-3.66a.69.69,0,0,0,.34-.6A.71.71,0,0,0,34.3,17.37ZM23.14,25H26v2.8H23.14Zm5.39-4.56V15.55l4,2.42Z" class="clr-i-outline clr-i-outline-path-2"></path> <rect x="0" y="0" width="36" height="36" fill-opacity="0"></rect> </g></svg>`,
  `<svg fill="#000000" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M25.0625 0C22.5 0 20.589844 0.0898438 19.15625 0.40625C18.4375 0.566406 17.824219 0.792969 17.3125 1.15625C16.800781 1.519531 16.394531 2.082031 16.3125 2.71875C16.261719 3.097656 16.253906 3.085938 16.15625 3.375C16.058594 3.664063 15.9375 4.128906 15.78125 5.0625C15.324219 7.824219 13.929688 7.667969 12.65625 9.03125C12.609375 9.082031 12.546875 9.101563 12.5 9.15625C10.996094 10.25 10 12.007813 10 14L10 36C10 37.992188 10.996094 39.75 12.5 40.84375C12.511719 40.855469 12.519531 40.863281 12.53125 40.875C12.574219 40.90625 12.613281 40.941406 12.65625 40.96875C13.90625 42.3125 15.261719 42.203125 15.78125 44.96875C15.9375 45.808594 16.070313 46.230469 16.15625 46.5C16.242188 46.769531 16.253906 46.839844 16.3125 47.28125C16.390625 47.898438 16.785156 48.449219 17.28125 48.8125C17.777344 49.175781 18.359375 49.398438 19.0625 49.5625C20.46875 49.890625 22.371094 50 24.9375 50C27.5 50 29.410156 49.910156 30.84375 49.59375C31.5625 49.433594 32.175781 49.207031 32.6875 48.84375C33.199219 48.480469 33.605469 47.917969 33.6875 47.28125C33.738281 46.902344 33.746094 46.914063 33.84375 46.625C33.941406 46.335938 34.0625 45.871094 34.21875 44.9375C34.675781 42.175781 36.070313 42.332031 37.34375 40.96875C37.386719 40.941406 37.425781 40.90625 37.46875 40.875C37.480469 40.863281 37.488281 40.855469 37.5 40.84375C39.003906 39.75 40 37.992188 40 36L40 34C40.550781 34 41 33.550781 41 33L41 27C41 26.449219 40.550781 26 40 26L40 23C41.113281 22.917969 42 21.976563 42 20.84375L42 17.15625C42 16.023438 41.113281 15.082031 40 15L40 14C40 12.007813 39.003906 10.25 37.5 9.15625C37.488281 9.144531 37.480469 9.136719 37.46875 9.125C37.425781 9.09375 37.386719 9.058594 37.34375 9.03125C36.09375 7.6875 34.738281 7.796875 34.21875 5.03125C34.0625 4.191406 33.929688 3.769531 33.84375 3.5C33.757813 3.230469 33.746094 3.160156 33.6875 2.71875C33.609375 2.101563 33.214844 1.550781 32.71875 1.1875C32.222656 0.824219 31.640625 0.601563 30.9375 0.4375C29.53125 0.109375 27.628906 0 25.0625 0 Z M 25.0625 2C27.566406 2 29.40625 2.121094 30.5 2.375C31.046875 2.503906 31.371094 2.664063 31.53125 2.78125C31.691406 2.898438 31.675781 2.921875 31.6875 3C31.757813 3.535156 31.855469 3.835938 31.9375 4.09375C32.019531 4.351563 32.105469 4.628906 32.25 5.40625C32.457031 6.511719 32.863281 7.328125 33.3125 8L16.71875 8C17.167969 7.324219 17.566406 6.488281 17.75 5.375C17.894531 4.507813 17.988281 4.21875 18.0625 4C18.136719 3.78125 18.246094 3.503906 18.3125 3C18.324219 2.914063 18.300781 2.902344 18.46875 2.78125C18.636719 2.660156 18.996094 2.5 19.5625 2.375C20.691406 2.125 22.554688 2 25.0625 2 Z M 16 10L34 10C36.21875 10 38 11.78125 38 14L38 16.15625C37.667969 16.773438 37.4375 17.664063 37.4375 19C37.4375 20.332031 37.671875 21.222656 38 21.84375L38 36C38 38.21875 36.21875 40 34 40L16 40C13.78125 40 12 38.21875 12 36L12 14C12 11.78125 13.78125 10 16 10 Z M 29 14C27.355469 14 26 15.355469 26 17C26 18.644531 27.355469 20 29 20C30.644531 20 32 18.644531 32 17C32 15.355469 30.644531 14 29 14 Z M 21.5 15C20.132813 15 19 16.132813 19 17.5C19 18.867188 20.132813 20 21.5 20C22.867188 20 24 18.867188 24 17.5C24 16.132813 22.867188 15 21.5 15 Z M 29 16C29.5625 16 30 16.4375 30 17C30 17.5625 29.5625 18 29 18C28.4375 18 28 17.5625 28 17C28 16.4375 28.4375 16 29 16 Z M 16.5 17C15.671875 17 15 17.671875 15 18.5C15 19.328125 15.671875 20 16.5 20C17.328125 20 18 19.328125 18 18.5C18 17.671875 17.328125 17 16.5 17 Z M 21.5 17C21.789063 17 22 17.210938 22 17.5C22 17.789063 21.789063 18 21.5 18C21.210938 18 21 17.789063 21 17.5C21 17.210938 21.210938 17 21.5 17 Z M 39.84375 17C39.945313 17 40 17.054688 40 17.15625L40 20.84375C40 20.945313 39.945313 21 39.84375 21L39.8125 21C39.800781 20.984375 39.796875 20.992188 39.78125 20.96875C39.648438 20.753906 39.4375 20.207031 39.4375 19C39.4375 17.792969 39.679688 17.242188 39.8125 17.03125C39.832031 17 39.828125 17.019531 39.84375 17 Z M 25 21C22.800781 21 21 22.800781 21 25C21 27.199219 22.800781 29 25 29C27.199219 29 29 27.199219 29 25C29 22.800781 27.199219 21 25 21 Z M 17 22C15.355469 22 14 23.355469 14 25C14 26.644531 15.355469 28 17 28C18.644531 28 20 26.644531 20 25C20 23.355469 18.644531 22 17 22 Z M 33 22C31.355469 22 30 23.355469 30 25C30 26.644531 31.355469 28 33 28C34.644531 28 36 26.644531 36 25C36 23.355469 34.644531 22 33 22 Z M 25 23C26.117188 23 27 23.882813 27 25C27 26.117188 26.117188 27 25 27C23.882813 27 23 26.117188 23 25C23 23.882813 23.882813 23 25 23 Z M 17 24C17.5625 24 18 24.4375 18 25C18 25.5625 17.5625 26 17 26C16.4375 26 16 25.5625 16 25C16 24.4375 16.4375 24 17 24 Z M 33 24C33.5625 24 34 24.4375 34 25C34 25.5625 33.5625 26 33 26C32.4375 26 32 25.5625 32 25C32 24.4375 32.4375 24 33 24 Z M 33.5 29C32.671875 29 32 29.671875 32 30.5C32 31.328125 32.671875 32 33.5 32C34.328125 32 35 31.328125 35 30.5C35 29.671875 34.328125 29 33.5 29 Z M 21 30C19.355469 30 18 31.355469 18 33C18 34.644531 19.355469 36 21 36C22.644531 36 24 34.644531 24 33C24 31.355469 22.644531 30 21 30 Z M 28.5 30C27.132813 30 26 31.132813 26 32.5C26 33.867188 27.132813 35 28.5 35C29.867188 35 31 33.867188 31 32.5C31 31.132813 29.867188 30 28.5 30 Z M 21 32C21.5625 32 22 32.4375 22 33C22 33.5625 21.5625 34 21 34C20.4375 34 20 33.5625 20 33C20 32.4375 20.4375 32 21 32 Z M 28.5 32C28.789063 32 29 32.210938 29 32.5C29 32.789063 28.789063 33 28.5 33C28.210938 33 28 32.789063 28 32.5C28 32.210938 28.210938 32 28.5 32 Z M 16.6875 42L33.28125 42C32.832031 42.675781 32.433594 43.511719 32.25 44.625C32.105469 45.492188 32.011719 45.78125 31.9375 46C31.863281 46.21875 31.753906 46.496094 31.6875 47C31.675781 47.085938 31.699219 47.097656 31.53125 47.21875C31.363281 47.339844 31.003906 47.5 30.4375 47.625C29.308594 47.875 27.445313 48 24.9375 48C22.433594 48 20.59375 47.878906 19.5 47.625C18.953125 47.496094 18.628906 47.335938 18.46875 47.21875C18.308594 47.101563 18.324219 47.078125 18.3125 47C18.242188 46.464844 18.144531 46.164063 18.0625 45.90625C17.980469 45.648438 17.894531 45.371094 17.75 44.59375C17.542969 43.488281 17.136719 42.671875 16.6875 42Z"></path></g></svg>`,
  `<svg viewBox="0 -2 18 18" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#000000" fill-rule="evenodd" d="M565,248.002473 C565,247.448823 565.443717,247 565.999807,247 L569.502301,247 C569.777173,247 570.09954,246.80092 570.221932,246.556135 L570.778068,245.443865 C570.900637,245.198725 571.22788,245 571.491005,245 L576.508995,245 C576.780169,245 577.09954,245.19908 577.221932,245.443865 L577.778068,246.556135 C577.900637,246.801275 578.214844,247 578.497699,247 L582.000193,247 C582.552371,247 583,247.455761 583,248.002473 L583,257.997527 C583,258.551177 582.555054,259 582.006602,259 L565.993398,259 C565.444759,259 565,258.544239 565,257.997527 L565,248.002473 Z M566,248 L570.437394,248 C570.708303,248 571.024681,247.80092 571.14366,247.556135 L571.900024,246 L576.150024,246 L576.851148,247.536133 C576.968077,247.79232 577.287834,248 577.554307,248 L582,248 L582,258 L566,258 L566,248 Z M574,257 C576.209139,257 578,255.209139 578,253 C578,250.790861 576.209139,249 574,249 C571.790861,249 570,250.790861 570,253 C570,255.209139 571.790861,257 574,257 Z M574,256 C575.656854,256 577,254.656854 577,253 C577,251.343146 575.656854,250 574,250 C572.343146,250 571,251.343146 571,253 C571,254.656854 572.343146,256 574,256 Z M580,252 C580.552285,252 581,251.552285 581,251 C581,250.447715 580.552285,250 580,250 C579.447715,250 579,250.447715 579,251 C579,251.552285 579.447715,252 580,252 Z M567,246.5 C567,246.223858 567.214035,246 567.504684,246 L568.495316,246 C568.774045,246 569,246.231934 569,246.5 L569,247 L567,247 L567,246.5 Z" transform="translate(-565 -245)"></path> </g></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="174.6501 104.1702 209.812 219.671" width="209.812px" height="219.671px"><path d="M 332.162 243.331 L 353.604 243.331 L 248.698 146.93 L 143.792 243.331 L 165.234 243.331 L 165.234 358.897 L 148.541 358.897 L 148.541 366.601 L 348.856 366.601 L 348.856 358.897 L 332.163 358.897 L 332.163 243.331 L 332.162 243.331 Z M 163.562 235.626 L 174.741 225.354 L 183.125 217.649 L 248.698 157.393 L 333.834 235.626 L 163.562 235.626 Z M 172.938 263.876 L 172.938 256.171 L 172.938 243.331 L 324.458 243.331 L 324.458 256.171 L 324.458 263.876 L 324.458 358.897 L 172.938 358.897 L 172.938 263.876 Z" style="" transform="matrix(0.9999998815070945, 0, 0, 0.9999998815070945, 30.858108498746823, -42.75978641974273)" /><path d="M 248.698 176.559 C 239.494 176.559 232.006 184.048 232.006 193.252 C 232.006 202.456 239.494 209.945 248.698 209.945 C 257.903 209.945 265.391 202.456 265.391 193.252 C 265.391 184.048 257.903 176.559 248.698 176.559 Z M 248.698 202.241 C 243.742 202.241 239.71 198.208 239.71 193.252 C 239.71 188.296 243.742 184.264 248.698 184.264 C 253.654 184.264 257.687 188.296 257.687 193.252 C 257.687 198.208 253.654 202.241 248.698 202.241 Z" style="" transform="matrix(0.9999998815070945, 0, 0, 0.9999998815070945, 30.858108498746823, -42.75978641974273)" /><path d="M 248.698 270.221 C 228.807 270.221 215.639 279.215 208.094 286.759 C 199.945 294.908 196.491 303.066 196.348 303.409 L 203.46 306.373 C 203.578 306.089 215.694 277.926 248.698 277.926 C 262.442 277.926 274.199 282.659 283.642 291.996 C 290.807 299.079 293.91 306.31 293.937 306.373 L 301.049 303.409 C 300.906 303.066 297.451 294.908 289.303 286.759 C 281.758 279.214 268.589 270.221 248.698 270.221 Z" style="" transform="matrix(0.9999998815070945, 0, 0, 0.9999998815070945, 30.858108498746823, -42.75978641974273)" /><path d="M 248.698 290.766 C 234.906 290.766 226.27 297.032 221.454 302.288 C 216.252 307.966 214.305 313.706 214.225 313.948 L 221.531 316.394 C 221.781 315.662 227.902 298.47 248.698 298.47 C 269.608 298.47 276.504 315.793 276.782 316.515 L 283.996 313.81 C 283.643 312.87 275.051 290.766 248.698 290.766 Z" style="" transform="matrix(0.9999998815070945, 0, 0, 0.9999998815070945, 30.858108498746823, -42.75978641974273)" /><path d="M 248.698 311.311 C 234.126 311.311 229.813 323.685 229.637 324.212 L 236.943 326.66 C 236.968 326.583 239.609 319.016 248.699 319.016 C 257.74 319.016 260.797 326.499 260.911 326.788 L 268.125 324.083 C 267.929 323.562 263.169 311.311 248.698 311.311 Z" style="" transform="matrix(0.9999998815070945, 0, 0, 0.9999998815070945, 30.858108498746823, -42.75978641974273)" /></svg>`,
];

function CategoryItem({collection, index}) {
  const ref = useRef(null);

  // Add a class to trigger animations when in view
  const handleIntersection = ([entry]) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  };

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
    });
    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div ref={ref} className="category-container">
      <Link to={`/collections/${collection.handle}`}>
        <div
          className="category-svg-wrapper"
          style={{width: '60px', height: '60px'}}
        >
          <div
            dangerouslySetInnerHTML={{__html: svgs[index % svgs.length]}}
            className="category-svg"
          />
        </div>
      </Link>
      <div className="category-title">{collection.title}</div>
    </div>
  );
}

