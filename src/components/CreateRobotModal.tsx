import React, { useState } from 'react';
import { X, Bot, ChevronRight } from 'lucide-react';
import { useTradingStore } from '../stores/tradingStore';
import { Robot } from '../types/mt5';
import { RobotSetupCompletionModal } from './RobotSetupCompletionModal';
import { RobotWizardStep1 } from './wizard/RobotWizardStep1';
import { RobotWizardStep2 } from './wizard/RobotWizardStep2';
import { RobotWizardStep3 } from './wizard/RobotWizardStep3';
import { supabaseUrl } from '../lib/supabase';

interface CreateRobotModalProps {
  onClose: () => void;
}

interface WizardData {
  step1: {
    name: string;
    symbol: string;
    strategy: string;
  };
  step2: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    maxLotSize: number;
    stopLoss: number;
    takeProfit: number;
  };
  step3: {
    isActive: boolean;
  };
}

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Name, symbol & strategy' },
  { id: 2, name: 'Risk Settings', description: 'Risk management & parameters' },
  { id: 3, name: 'Review', description: 'Confirm & create' }
];

export const CreateRobotModal: React.FC<CreateRobotModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [createdRobot, setCreatedRobot] = useState<Robot | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { createRobot, availableSymbols, fetchAvailableSymbols } = useTradingStore();

  const [wizardData, setWizardData] = useState<WizardData>({
    step1: { name: '', symbol: '', strategy: '' },
    step2: { riskLevel: 'MEDIUM', maxLotSize: 0.01, stopLoss: 50, takeProfit: 100 },
    step3: { isActive: false }
  });

  // Fetch available symbols if needed
  React.useEffect(() => {
    if (availableSymbols.length === 0) {
      fetchAvailableSymbols();
    }
  }, [availableSymbols.length, fetchAvailableSymbols]);

  // Get current user ID
  React.useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };

    getCurrentUserId();
  }, []);

  const handleStep1Next = (data: WizardData['step1']) => {
    setWizardData(prev => ({ ...prev, step1: data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: WizardData['step2']) => {
    setWizardData(prev => ({ ...prev, step2: data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: WizardData['step3']) => {
    setWizardData(prev => ({ ...prev, step3: data }));
    setIsCreating(true);

    try {
      const robotData = {
        name: wizardData.step1.name,
        symbol: wizardData.step1.symbol,
        strategy: wizardData.step1.strategy,
        riskLevel: wizardData.step2.riskLevel,
        maxLotSize: wizardData.step2.maxLotSize,
        stopLoss: wizardData.step2.stopLoss,
        takeProfit: wizardData.step2.takeProfit,
        isActive: data.isActive
      };

      console.log('🤖 Creating robot with wizard data:', robotData);

      const robot = await createRobot(robotData);

      if (robot) {
        setCreatedRobot(robot);
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error creating robot:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCreatedRobot(null);
    onClose();
  };

  const webhookUrl = `${supabaseUrl}/functions/v1/tradingview-webhook`;

  if (showCompletionModal && createdRobot && currentUserId) {
    return (
      <RobotSetupCompletionModal
        robot={createdRobot}
        userId={currentUserId}
        webhookUrl={webhookUrl}
        onClose={handleCloseCompletionModal}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Trading Robot</h2>
                <p className="text-sm text-gray-500">Set up your automated trading robot in 3 easy steps</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.id}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className={`w-5 h-5 ${
                      currentStep > step.id ? 'text-blue-600' : 'text-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <RobotWizardStep1
              data={wizardData.step1}
              onNext={handleStep1Next}
              availableSymbols={availableSymbols}
            />
          )}

          {currentStep === 2 && (
            <RobotWizardStep2
              data={wizardData.step2}
              onNext={handleStep2Next}
              onBack={handleBack}
              strategy={wizardData.step1.strategy}
              symbol={wizardData.step1.symbol}
            />
          )}

          {currentStep === 3 && (
            <RobotWizardStep3
              data={wizardData.step3}
              onSubmit={handleStep3Submit}
              onBack={handleBack}
              formData={{
                ...wizardData.step1,
                ...wizardData.step2
              }}
              isCreating={isCreating}
            />
          )}
        </div>
      </div>
    </div>
  );
};