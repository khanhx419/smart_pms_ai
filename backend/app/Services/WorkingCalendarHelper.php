<?php

namespace App\Services;

use DateTime;
use DateTimeImmutable;
use DateTimeInterface;

class WorkingCalendarHelper
{
    public const WORK_START_HOUR = 8;
    public const WORK_END_HOUR = 17;
    public const LUNCH_START_HOUR = 12;
    public const LUNCH_END_HOUR = 13;
    public const WORK_HOURS_PER_DAY = 8; // 8-12 (4h) + 13-17 (4h)

    /**
     * Check if a given DateTime is during working hours (excluding weekends and lunch).
     */
    public static function isWorkingTime(DateTimeInterface $dt): bool
    {
        $dayOfWeek = (int)$dt->format('N'); // 1 (Mon) through 7 (Sun)
        if ($dayOfWeek >= 6) {
            return false; // Weekend
        }

        $hour = (int)$dt->format('H');
        $min = (int)$dt->format('i');
        $timeInMin = $hour * 60 + $min;

        $morningStart = self::WORK_START_HOUR * 60;
        $morningEnd = self::LUNCH_START_HOUR * 60;
        $afternoonStart = self::LUNCH_END_HOUR * 60;
        $afternoonEnd = self::WORK_END_HOUR * 60;

        $isMorning = ($timeInMin >= $morningStart && $timeInMin < $morningEnd);
        $isAfternoon = ($timeInMin >= $afternoonStart && $timeInMin < $afternoonEnd);

        return $isMorning || $isAfternoon;
    }

    /**
     * Adjusts a datetime to the next available working start if it falls outside working hours.
     */
    public static function alignToWorkingTime(DateTimeInterface $dt): DateTime
    {
        $res = new DateTime($dt->format('Y-m-d H:i:s'));

        while (true) {
            $dayOfWeek = (int)$res->format('N'); // 1 (Mon) to 7 (Sun)

            // Weekend -> move to Monday 08:00
            if ($dayOfWeek === 6) {
                // Saturday -> move +2 days to Monday
                $res->modify('+2 days');
                $res->setTime(self::WORK_START_HOUR, 0, 0);
                continue;
            }
            if ($dayOfWeek === 7) {
                // Sunday -> move +1 day to Monday
                $res->modify('+1 day');
                $res->setTime(self::WORK_START_HOUR, 0, 0);
                continue;
            }

            $hour = (int)$res->format('H');
            $min = (int)$res->format('i');
            $sec = (int)$res->format('s');
            $timeInMin = $hour * 60 + $min;

            // Before 08:00 -> set to 08:00 today
            if ($timeInMin < self::WORK_START_HOUR * 60) {
                $res->setTime(self::WORK_START_HOUR, 0, 0);
                break;
            }

            // During lunch 12:00 - 13:00 -> set to 13:00 today
            if ($timeInMin >= self::LUNCH_START_HOUR * 60 && $timeInMin < self::LUNCH_END_HOUR * 60) {
                $res->setTime(self::LUNCH_END_HOUR, 0, 0);
                break;
            }

            // At or after 17:00 -> move to tomorrow 08:00
            if ($timeInMin >= self::WORK_END_HOUR * 60) {
                $res->modify('+1 day');
                $res->setTime(self::WORK_START_HOUR, 0, 0);
                continue; // loop again to verify if tomorrow is weekend
            }

            // Valid working time
            break;
        }

        return $res;
    }

    /**
     * Adds N working hours to a start date, skipping lunch breaks and weekends.
     */
    public static function addWorkingHours(DateTimeInterface $startDate, int $hours): DateTime
    {
        $dt = self::alignToWorkingTime($startDate);

        if ($hours <= 0) {
            return $dt;
        }

        $remainingMinutes = $hours * 60;

        while ($remainingMinutes > 0) {
            $dt = self::alignToWorkingTime($dt);

            $hour = (int)$dt->format('H');
            $min = (int)$dt->format('i');
            $timeInMin = $hour * 60 + $min;

            // In morning session (08:00 - 12:00)
            if ($timeInMin >= self::WORK_START_HOUR * 60 && $timeInMin < self::LUNCH_START_HOUR * 60) {
                $sessionEndMin = self::LUNCH_START_HOUR * 60;
                $availMinutes = $sessionEndMin - $timeInMin;

                if ($remainingMinutes <= $availMinutes) {
                    $dt->modify("+{$remainingMinutes} minutes");
                    $remainingMinutes = 0;
                } else {
                    $remainingMinutes -= $availMinutes;
                    $dt->setTime(self::LUNCH_END_HOUR, 0, 0); // Advance past lunch to 13:00
                }
            }
            // In afternoon session (13:00 - 17:00)
            elseif ($timeInMin >= self::LUNCH_END_HOUR * 60 && $timeInMin < self::WORK_END_HOUR * 60) {
                $sessionEndMin = self::WORK_END_HOUR * 60;
                $availMinutes = $sessionEndMin - $timeInMin;

                if ($remainingMinutes <= $availMinutes) {
                    $dt->modify("+{$remainingMinutes} minutes");
                    $remainingMinutes = 0;
                } else {
                    $remainingMinutes -= $availMinutes;
                    // Move to tomorrow 08:00
                    $dt->modify('+1 day');
                    $dt->setTime(self::WORK_START_HOUR, 0, 0);
                }
            }
        }

        return $dt;
    }
}
