import React, {useEffect, useState} from 'react';
import {SwaggerUIBundle} from 'swagger-ui-dist';
import SwaggerParser from 'swagger-parser'
import YAML from 'yaml-js'
import 'swagger-ui/dist/swagger-ui.css';
import {SwaggerUIKongTheme} from 'swagger-ui-kong-theme'
import {useParams, useNavigate} from 'react-router-dom';
import {Route as ROUTE} from './routes';
import './SwaggerLoader.css';

let swaggerUIOptions = {

    dom_id: '#ui-wrapper', // Determine what element to load swagger ui
    docExpansion: 'list',
    deepLinking: true, // Enables dynamic deep linking for tags and operations
    filter: true,
    presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
    ],
    plugins: [
        SwaggerUIKongTheme,
        SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: 'KongLayout',
}

const SwaggerLoader = () => {
    const navigate = useNavigate();
    const {specUrl, config} = useParams();
    //error
    const [hasError, setError] = useState(false);

    useEffect(() => {
            loadSwaggerUI();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSwaggerUI = async () => {
        setError(false);
        const parseSpec = (contents) => {
            let parsedSpec //set empty var to hold spec
            let errorArray = [];

            try {
                //parse spec as JSON
                //if failed push json error msg into error array
                parsedSpec = JSON.parse(contents);
            } catch (jsonError) {
                const errorMsg = (libraryMsg) => `Error trying to parse ${libraryMsg}:<br>`;
                errorArray.push(errorMsg('JSON'), jsonError)
                //    try to parse as YAML
                try {
                    parsedSpec = YAML.load(contents);
                } catch (yamlError) {
                    errorArray.push(errorMsg('YAML'), yamlError)
                }
            }
            SwaggerParser.validate(parsedSpec, (err) => {
                return err && console.error(err);
            });

            return parsedSpec ? parsedSpec : errorArray;
        };

        const loadSpec = async (url) => {
            try {
                return parseSpec(await (await fetch(`${window.location.origin}/${url}`
                )).text())
            } catch (e) {
                setError(true);
                console.log(`error: ${e}`);
            }
        };

        const loadUrlConfig = async (specUrl, config) => {
            if (specUrl) {
                const url = decodeURIComponent(specUrl);
                if (config) {
                    swaggerUIOptions = {
                        ...swaggerUIOptions,
                        ...JSON.parse(decodeURIComponent(config))
                    }
                }
                try {
                    swaggerUIOptions.spec = await loadSpec(url);
                    return swaggerUIOptions;
                } catch (e) {
                    console.log(`error: ${e}`);
                    setError(true);
                }
            } else {
                throw new Error('Failed to load');
            }
        };

        try {
            const options = await loadUrlConfig(specUrl, config);
            if (options) {
                SwaggerUIBundle(options);
            }
        } catch (e) {
            setError(true);
        }
    }

    return (<div>
        <div className='btn-panel'>
            <button onClick={() => {
                navigate(ROUTE.HOME)
            }}>Back
            </button>
        </div>
        <div className='btn-panel'>
            {hasError && <button onClick={loadSwaggerUI}>Try Again</button>}
        </div>
        <div id="ui-wrapper"/>
    </div>);
}

export default SwaggerLoader;
