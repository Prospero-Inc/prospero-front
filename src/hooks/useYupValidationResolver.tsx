/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react'
import { FieldValues, Resolver } from 'react-hook-form'
import * as yup from 'yup'

export const useYupValidationResolver = <T extends FieldValues>(
  validationSchema: yup.ObjectSchema<T>
): Resolver<T> =>
  useCallback(
    async (data: T) => {
      try {
        const values = await validationSchema.validate(data, {
          abortEarly: false
        })

        return {
          values,
          errors: {}
        }
      } catch (errors: any) {
        return {
          values: {},
          errors: errors.inner.reduce(
            (
              allErrors: any,
              currentError: { path: any; type: any; message: any }
            ) => ({
              ...allErrors,
              [currentError.path]: {
                type: currentError.type ?? 'validation',
                message: currentError.message
              }
            }),
            {}
          )
        }
      }
    },
    [validationSchema]
  )
