// helpers/jobQueueSystem/agenda.ts
import Agenda from 'agenda';
import config from '../../config';
import { logger, errorLogger } from '../../shared/logger';
import colors from 'colors';
import defineJobs from './defineJobs';
let agenda: Agenda | null = null;
let isRunning = false;

export const getAgenda = (): Agenda => {
    if (!agenda) {
        agenda = new Agenda({
            db: {
                address: config.database_url as string,
                collection: 'emailJobs',
                options: {}
            },
            processEvery: '30 seconds',
            maxConcurrency: 20,
            defaultConcurrency: 5,
            lockLimit: 0,
            defaultLockLimit: 0,
            defaultLockLifetime: 10000,
        });

        // Define all jobs here
        defineJobs(agenda);

        // Error handling
        agenda.on('error', (error) => {
            errorLogger.error('Agenda error:', error);
        });

        agenda.on('fail', (error, job) => {
            errorLogger.error(`Job ${job.attrs.name} failed:`, error);
        });
    }

    return agenda;
};

export const startAgenda = async (): Promise<void> => {
    if (isRunning) {
        logger.warn('Agenda is already running');
        return;
    }

    try {
        const agendaInstance = getAgenda();
        await agendaInstance.start();
        isRunning = true;
        logger.info(colors.bgBlue('🚀 Agenda started successfully'));
    } catch (error) {
        isRunning = false;
        errorLogger.error('Failed to start Agenda:', error);
        throw error;
    }
};

export const stopAgenda = async (): Promise<void> => {
    if (!isRunning || !agenda) {
        return;
    }

    try {
        await agenda.stop();
        isRunning = false;
        logger.info('✅ Agenda stopped');
    } catch (error) {
        errorLogger.error('Failed to stop Agenda:', error);
        throw error;
    }
};

export const isAgendaRunning = (): boolean => {
    return isRunning;
};

export default agenda;
