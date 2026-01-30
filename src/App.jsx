import React, { useState, useMemo } from 'react';

// Updated Retell.ai pricing data - January 2025
const VOICE_ENGINES = {
  'elevenlabs': { name: 'ElevenLabs/Cartesia', rate: 0.070 },
  'openai': { name: 'OpenAI Voices', rate: 0.080 },
  'minimax': { name: 'Minimax', rate: 0.070 },
};

const LLM_MODELS = {
  'gpt_5': { name: 'GPT 5', rate: 0.040 },
  'gpt_5_fast': { name: 'GPT 5 (Fast)', rate: 0.080 },
  'gpt_5_mini': { name: 'GPT 5 mini', rate: 0.012 },
  'gpt_5_mini_fast': { name: 'GPT 5 mini (Fast)', rate: 0.024 },
  'gpt_5_nano': { name: 'GPT 5 nano', rate: 0.003 },
  'gpt_4_1': { name: 'GPT 4.1', rate: 0.045 },
  'gpt_4_1_fast': { name: 'GPT 4.1 (Fast)', rate: 0.0675 },
  'gpt_4_1_mini': { name: 'GPT 4.1 mini', rate: 0.016 },
  'gpt_4_1_mini_fast': { name: 'GPT 4.1 mini (Fast)', rate: 0.024 },
  'gpt_4_1_nano': { name: 'GPT 4.1 nano', rate: 0.004 },
  'gpt_4o': { name: 'GPT 4o', rate: 0.050 },
  'gpt_4o_fast': { name: 'GPT 4o (Fast)', rate: 0.075 },
  'gpt_4o_mini': { name: 'GPT 4o mini', rate: 0.006 },
  'gpt_4o_mini_fast': { name: 'GPT 4o mini (Fast)', rate: 0.009 },
  'claude_4_5_sonnet': { name: 'Claude 4.5 Sonnet', rate: 0.080 },
  'claude_4_5_haiku': { name: 'Claude 4.5 Haiku', rate: 0.025 },
  'claude_3_7_sonnet': { name: 'Claude 3.7 Sonnet', rate: 0.060 },
  'claude_3_5_haiku': { name: 'Claude 3.5 Haiku', rate: 0.020 },
  'gemini_2_flash': { name: 'Gemini 2.0 Flash', rate: 0.006 },
  'gemini_2_flash_lite': { name: 'Gemini 2.0 Flash Lite', rate: 0.003 },
};

const TELEPHONY = {
  'us': { name: 'US', rate: 0.015 },
  'us_tollfree': { name: 'US Toll-Free', rate: 0.060 },
  'canada': { name: 'Canada', rate: 0.030 },
  'canada_telnyx': { name: 'Canada (Telnyx)', rate: 0.030 },
  'us_telnyx': { name: 'US (Telnyx)', rate: 0.030 },
  'mexico': { name: 'Mexico', rate: 0.050 },
  'uk': { name: 'UK', rate: 0.100 },
  'germany': { name: 'Germany', rate: 0.100 },
  'france': { name: 'France', rate: 0.060 },
  'spain': { name: 'Spain', rate: 0.100 },
  'italy': { name: 'Italy', rate: 0.060 },
  'australia': { name: 'Australia', rate: 0.100 },
  'japan': { name: 'Japan', rate: 0.280 },
  'india': { name: 'India', rate: 0.150 },
  'india_telnyx': { name: 'India (Telnyx)', rate: 0.250 },
  'indonesia': { name: 'Indonesia', rate: 0.400 },
  'philippines': { name: 'Philippines', rate: 0.800 },
  'malaysia': { name: 'Malaysia', rate: 0.200 },
  'thailand': { name: 'Thailand', rate: 0.450 },
  'sip': { name: 'SIP Trunk/Custom', rate: 0.000 },
};

const TRANSCRIPT_GROWTH = {
  'light': { name: 'Light (simple Q&A)', rate: 200 },
  'moderate': { name: 'Moderate (typical sales)', rate: 300 },
  'heavy': { name: 'Heavy (complex/verbose)', rate: 400 },
  'very_heavy': { name: 'Very Heavy (lots of tools)', rate: 500 },
};

const TOKEN_THRESHOLD = 3500;

export default function RetellCostCalculator() {
  const [voiceEngine, setVoiceEngine] = useState('elevenlabs');
  const [llmModel, setLlmModel] = useState('gpt_4_1');
  const [telephony, setTelephony] = useState('us');
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [useVoiceCancellation, setUseVoiceCancellation] = useState(true);
  const [useDenoising, setUseDenoising] = useState(false);
  const [usePII, setUsePII] = useState(false);
  
  const [dashboardTokens, setDashboardTokens] = useState('3132');
  const [transcriptGrowth, setTranscriptGrowth] = useState('moderate');
  
  const [minCallDuration, setMinCallDuration] = useState('8');
  const [maxCallDuration, setMaxCallDuration] = useState('15');
  const [avgCallDuration, setAvgCallDuration] = useState('12');
  
  const [callsPerDay, setCallsPerDay] = useState('50');
  const [daysPerMonth, setDaysPerMonth] = useState('22');
  
  const [liveAgentHourlyRate, setLiveAgentHourlyRate] = useState('25');
  const [liveAgentUtilization, setLiveAgentUtilization] = useState('75');

  // Parse string inputs to numbers
  const tokens = Number(dashboardTokens) || 0;
  const minDur = Number(minCallDuration) || 1;
  const maxDur = Number(maxCallDuration) || 1;
  const avgDur = Number(avgCallDuration) || 1;
  const cpd = Number(callsPerDay) || 0;
  const dpm = Number(daysPerMonth) || 0;
  const liveRate = Number(liveAgentHourlyRate) || 1;
  const liveUtil = Number(liveAgentUtilization) || 1;

  const calculations = useMemo(() => {
    const voice = VOICE_ENGINES[voiceEngine];
    const llm = LLM_MODELS[llmModel];
    const phone = TELEPHONY[telephony];
    const growthRate = TRANSCRIPT_GROWTH[transcriptGrowth].rate;
    
    const voicePerMin = voice.rate;
    const phonePerMin = phone.rate;
    const kbPerMin = useKnowledgeBase ? 0.005 : 0;
    const vcPerMin = useVoiceCancellation ? 0.005 : 0;
    const denoisePerMin = useDenoising ? 0.005 : 0;
    const piiPerMin = usePII ? 0.01 : 0;
    const nonLlmPerMin = voicePerMin + phonePerMin + kbPerMin + vcPerMin + denoisePerMin + piiPerMin;
    
    const calculateForDuration = (duration) => {
      const totalTokens = tokens + (growthRate * duration);
      const scalingFactor = totalTokens > TOKEN_THRESHOLD 
        ? totalTokens / TOKEN_THRESHOLD 
        : 1.0;
      const llmEffectivePerMin = llm.rate * scalingFactor;
      const tokenSurchargePerMin = llmEffectivePerMin - llm.rate;
      const totalPerMin = nonLlmPerMin + llmEffectivePerMin;
      const totalCost = totalPerMin * duration;
      const tokenSurchargeCost = tokenSurchargePerMin * duration;
      const costPerHour = totalPerMin * 60;
      
      return {
        duration,
        totalTokens,
        scalingFactor,
        llmEffectivePerMin,
        tokenSurchargePerMin,
        totalPerMin,
        totalCost,
        tokenSurchargeCost,
        costPerHour,
      };
    };
    
    const minCalc = calculateForDuration(minDur);
    const avgCalc = calculateForDuration(avgDur);
    const maxCalc = calculateForDuration(maxDur);
    
    const rangeTable = [];
    for (let d = minDur; d <= maxDur; d += 1) {
      rangeTable.push(calculateForDuration(d));
    }
    
    const callsPerMonth = cpd * dpm;
    const totalMinutesPerMonth = callsPerMonth * avgDur;
    const monthlyCost = callsPerMonth * avgCalc.totalCost;
    const monthlyTokenSurcharge = callsPerMonth * avgCalc.tokenSurchargeCost;
    
    const liveAgentEffectiveHourly = liveRate / (liveUtil / 100);
    const retellHourly = avgCalc.costPerHour;
    const savings = liveAgentEffectiveHourly - retellHourly;
    const savingsPercent = (savings / liveAgentEffectiveHourly) * 100;
    
    return {
      voice,
      llm,
      phone,
      growthRate,
      nonLlmPerMin,
      llmBasePerMin: llm.rate,
      minCalc,
      avgCalc,
      maxCalc,
      rangeTable,
      callsPerMonth,
      totalMinutesPerMonth,
      monthlyCost,
      monthlyTokenSurcharge,
      liveAgentEffectiveHourly,
      retellHourly,
      savings,
      savingsPercent,
    };
  }, [voiceEngine, llmModel, telephony, useKnowledgeBase, useVoiceCancellation, useDenoising, usePII, tokens, transcriptGrowth, minDur, maxDur, avgDur, cpd, dpm, liveRate, liveUtil]);

  const formatCurrency = (val) => val < 0.01 ? `$${val.toFixed(4)}` : `$${val.toFixed(3)}`;
  const formatCurrency2 = (val) => `$${val.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Retell.ai Cost Calculator</h1>
        <p className="text-gray-400 mb-6">Enter the token count from your Retell dashboard for accurate estimates</p>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            
            {/* Dashboard Token Input */}
            <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-600 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-1 text-orange-400">📊 Dashboard Token Count</h2>
              <p className="text-xs text-gray-400 mb-4">Enter the token count shown in your Retell agent dashboard (e.g., "2812-3452 tokens" → enter 3132)</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Base Tokens (from dashboard)</label>
                  <input 
                    type="text"
                    value={dashboardTokens}
                    onChange={(e) => setDashboardTokens(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white text-xl font-bold border-2 border-orange-500 focus:border-orange-400 focus:outline-none"
                    placeholder="3132"
                  />
                  <p className="text-xs text-gray-500 mt-1">This is your prompt + tools + states before any conversation</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Transcript Growth Rate</label>
                  <select 
                    value={transcriptGrowth}
                    onChange={(e) => setTranscriptGrowth(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border-2 border-orange-500 focus:border-orange-400 focus:outline-none"
                  >
                    {Object.entries(TRANSCRIPT_GROWTH).map(([key, val]) => (
                      <option key={key} value={key}>{val.name} (+{val.rate}/min)</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">How fast tokens grow as conversation continues</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${tokens > TOKEN_THRESHOLD ? 'bg-red-500' : tokens > 2500 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (tokens / TOKEN_THRESHOLD) * 100)}%` }}
                  />
                </div>
                <span className="text-sm">
                  {tokens > TOKEN_THRESHOLD ? (
                    <span className="text-red-400">⚠️ Already over 3,500!</span>
                  ) : (
                    <span className="text-gray-400">{TOKEN_THRESHOLD - tokens} tokens until surcharge</span>
                  )}
                </span>
              </div>
            </div>
            
            {/* Agent Configuration */}
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-blue-400">🎙️ Agent Configuration</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Voice Engine</label>
                  <select 
                    value={voiceEngine}
                    onChange={(e) => setVoiceEngine(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  >
                    {Object.entries(VOICE_ENGINES).map(([key, val]) => (
                      <option key={key} value={key}>{val.name} (${val.rate}/min)</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">LLM Model</label>
                  <select 
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  >
                    {Object.entries(LLM_MODELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.name} (${val.rate}/min)</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Telephony</label>
                  <select 
                    value={telephony}
                    onChange={(e) => setTelephony(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  >
                    {Object.entries(TELEPHONY).map(([key, val]) => (
                      <option key={key} value={key}>{val.name} (${val.rate}/min)</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useKnowledgeBase}
                    onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm">Knowledge Base ($0.005/min)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useVoiceCancellation}
                    onChange={(e) => setUseVoiceCancellation(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm">Voice Cancellation ($0.005/min)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useDenoising}
                    onChange={(e) => setUseDenoising(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm">Advanced Denoising ($0.005/min)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={usePII}
                    onChange={(e) => setUsePII(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm">PII Removal ($0.01/min)</span>
                </label>
              </div>
            </div>
            
            {/* Call Duration Range */}
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-green-400">⏱️ Call Duration Range</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min Duration (min)</label>
                  <input 
                    type="text"
                    value={minCallDuration}
                    onChange={(e) => setMinCallDuration(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                    placeholder="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Avg Duration (min)</label>
                  <input 
                    type="text"
                    value={avgCallDuration}
                    onChange={(e) => setAvgCallDuration(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                    placeholder="12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Duration (min)</label>
                  <input 
                    type="text"
                    value={maxCallDuration}
                    onChange={(e) => setMaxCallDuration(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                    placeholder="15"
                  />
                </div>
              </div>
            </div>
            
            {/* Cost by Duration Table */}
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-purple-400">📋 Cost by Call Duration</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-2">Duration</th>
                      <th className="text-right py-2 px-2">Tokens</th>
                      <th className="text-right py-2 px-2">Scaling</th>
                      <th className="text-right py-2 px-2">Rate/min</th>
                      <th className="text-right py-2 px-2">Surcharge</th>
                      <th className="text-right py-2 px-2">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.rangeTable.map((row, idx) => (
                      <tr 
                        key={row.duration} 
                        className={`border-b border-gray-700 ${row.duration === avgDur ? 'bg-green-900/30' : ''}`}
                      >
                        <td className="py-2 px-2">
                          {row.duration} min
                          {row.duration === avgDur && <span className="text-green-400 text-xs ml-1">(avg)</span>}
                        </td>
                        <td className={`text-right px-2 ${row.totalTokens > TOKEN_THRESHOLD ? 'text-orange-400' : 'text-gray-300'}`}>
                          {row.totalTokens.toLocaleString()}
                        </td>
                        <td className={`text-right px-2 ${row.scalingFactor > 1 ? 'text-orange-400 font-medium' : 'text-gray-400'}`}>
                          {row.scalingFactor > 1 ? `${row.scalingFactor.toFixed(2)}x` : '1.00x'}
                        </td>
                        <td className="text-right px-2 text-blue-400">{formatCurrency(row.totalPerMin)}</td>
                        <td className={`text-right px-2 ${row.tokenSurchargeCost > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                          {row.tokenSurchargeCost > 0 ? `+${formatCurrency2(row.tokenSurchargeCost)}` : '—'}
                        </td>
                        <td className="text-right px-2 text-green-400 font-semibold">{formatCurrency2(row.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Campaign Parameters */}
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-cyan-400">📊 Campaign Volume</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Calls Per Day</label>
                  <input 
                    type="text"
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    placeholder="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Days Per Month</label>
                  <input 
                    type="text"
                    value={daysPerMonth}
                    onChange={(e) => setDaysPerMonth(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-cyan-500 focus:outline-none"
                    placeholder="22"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Results */}
          <div className="space-y-4">
            
            {/* Per Minute Estimates */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-300 mb-3">Per Minute Estimates</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Min ({minDur} min call)</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{formatCurrency(calculations.minCalc.totalPerMin)}/min</span>
                    <span className="text-gray-500 text-xs block">{formatCurrency2(calculations.minCalc.costPerHour)}/hr</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700 bg-green-900/20 -mx-4 px-4">
                  <span className="text-green-400">Avg ({avgDur} min call)</span>
                  <div className="text-right">
                    <span className="text-green-400 font-bold text-lg">{formatCurrency(calculations.avgCalc.totalPerMin)}/min</span>
                    <span className="text-green-300 text-sm block">{formatCurrency2(calculations.avgCalc.costPerHour)}/hr</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Max ({maxDur} min call)</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{formatCurrency(calculations.maxCalc.totalPerMin)}/min</span>
                    <span className="text-gray-500 text-xs block">{formatCurrency2(calculations.maxCalc.costPerHour)}/hr</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Totals */}
            <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-5">
              <p className="text-green-300 text-sm mb-1">Estimated Monthly Cost</p>
              <p className="text-4xl font-bold">{formatCurrency2(calculations.monthlyCost)}</p>
              <p className="text-green-300 text-xs mt-2">
                {calculations.callsPerMonth.toLocaleString()} calls × {formatCurrency2(calculations.avgCalc.totalCost)}/call
              </p>
              {calculations.avgCalc.scalingFactor > 1 && (
                <p className="text-orange-300 text-xs mt-1">
                  Includes {formatCurrency2(calculations.monthlyTokenSurcharge)} token surcharge
                </p>
              )}
            </div>
            
            {/* Volume Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Monthly Calls</p>
                <p className="text-xl font-bold text-purple-400">{calculations.callsPerMonth.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Monthly Minutes</p>
                <p className="text-xl font-bold text-cyan-400">{calculations.totalMinutesPerMonth.toLocaleString()}</p>
              </div>
            </div>
            
            {/* Token Analysis */}
            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">🔢 Token Analysis (avg call)</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base tokens:</span>
                  <span className="text-white">{tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">+ Transcript ({avgDur} min):</span>
                  <span className="text-white">+{(calculations.growthRate * avgDur).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                  <span className="text-gray-300">Total tokens:</span>
                  <span className={`font-bold ${calculations.avgCalc.totalTokens > TOKEN_THRESHOLD ? 'text-orange-400' : 'text-green-400'}`}>
                    {calculations.avgCalc.totalTokens.toLocaleString()}
                  </span>
                </div>
                {calculations.avgCalc.scalingFactor > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Scaling factor:</span>
                    <span className="text-orange-400 font-bold">{calculations.avgCalc.scalingFactor.toFixed(2)}x</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Rate Breakdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-300 mb-2">Rate Breakdown</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Voice ({calculations.voice.name}):</span>
                  <span className="text-gray-300">{formatCurrency(calculations.voice.rate)}/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LLM ({calculations.llm.name}):</span>
                  <span className="text-gray-300">{formatCurrency(calculations.llmBasePerMin)}/min</span>
                </div>
                {calculations.avgCalc.scalingFactor > 1 && (
                  <div className="flex justify-between">
                    <span className="text-orange-400">└ + Token surcharge:</span>
                    <span className="text-orange-400">+{formatCurrency(calculations.avgCalc.tokenSurchargePerMin)}/min</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Telephony ({calculations.phone.name}):</span>
                  <span className="text-gray-300">{formatCurrency(calculations.phone.rate)}/min</span>
                </div>
                {useKnowledgeBase && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Knowledge Base:</span>
                    <span className="text-gray-300">$0.005/min</span>
                  </div>
                )}
                {useVoiceCancellation && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Voice Cancellation:</span>
                    <span className="text-gray-300">$0.005/min</span>
                  </div>
                )}
                {useDenoising && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Advanced Denoising:</span>
                    <span className="text-gray-300">$0.005/min</span>
                  </div>
                )}
                {usePII && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">PII Removal:</span>
                    <span className="text-gray-300">$0.010/min</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-600 pt-1 mt-1 font-semibold">
                  <span className="text-gray-200">Effective rate:</span>
                  <span className="text-green-400">{formatCurrency(calculations.avgCalc.totalPerMin)}/min</span>
                </div>
              </div>
            </div>
            
            {/* Live Agent Comparison */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-300 mb-3">👤 Live Agent Comparison</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hourly Rate</label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">$</span>
                    <input 
                      type="text"
                      value={liveAgentHourlyRate}
                      onChange={(e) => setLiveAgentHourlyRate(e.target.value)}
                      className="w-full bg-gray-700 rounded px-2 py-1 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="25"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Utilization %</label>
                  <div className="flex items-center">
                    <input 
                      type="text"
                      value={liveAgentUtilization}
                      onChange={(e) => setLiveAgentUtilization(e.target.value)}
                      className="w-full bg-gray-700 rounded px-2 py-1 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="75"
                    />
                    <span className="text-gray-500 ml-1">%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs space-y-1 border-t border-gray-700 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Live (nominal):</span>
                  <span className="text-gray-300">{formatCurrency2(liveRate)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Live (effective @ {liveUtil}%):</span>
                  <span className="text-white font-medium">{formatCurrency2(calculations.liveAgentEffectiveHourly)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Retell (100% util.):</span>
                  <span className="text-green-400 font-medium">{formatCurrency2(calculations.retellHourly)}/hr</span>
                </div>
              </div>
              
              <div className={`rounded-lg p-3 mt-3 ${calculations.savings > 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${calculations.savings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculations.savings > 0 ? '💰 Savings' : '⚠️ Difference'}
                  </span>
                  <span className={`font-bold ${calculations.savings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency2(Math.abs(calculations.savings))}/hr
                  </span>
                </div>
                <p className={`text-xs mt-1 ${calculations.savings > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {calculations.savings > 0 
                    ? `${calculations.savingsPercent.toFixed(0)}% cheaper than live agent`
                    : `${Math.abs(calculations.savingsPercent).toFixed(0)}% more than live agent`
                  }
                </p>
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-gray-800 rounded-lg p-4 text-xs">
              <h3 className="font-semibold mb-2 text-gray-300">💡 Tips to Reduce Costs</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Keep base tokens under 3,500</li>
                <li>• Use Knowledge Base instead of long prompts</li>
                <li>• Split complex prompts into nodes/states</li>
                <li>• Gemini 2.0 Flash is $0.006/min vs GPT at $0.045+</li>
                <li>• Minimize tool descriptions</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Formula Reference */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">📐 Token Surcharge Formula (from Retell docs)</h3>
          <div className="flex gap-4 text-xs">
            <code className="bg-gray-700 px-3 py-1 rounded text-blue-400">Scaling Factor = Total Tokens ÷ 3,500</code>
            <code className="bg-gray-700 px-3 py-1 rounded text-blue-400">Billed LLM = Base LLM Rate × Scaling Factor</code>
            <span className="text-gray-500">Only applies when tokens &gt; 3,500</span>
          </div>
        </div>
      </div>
    </div>
  );
}
